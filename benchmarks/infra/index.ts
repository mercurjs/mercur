import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx"
import * as pulumi from "@pulumi/pulumi"
import * as random from "@pulumi/random"

const cfg = new pulumi.Config()
const stack = pulumi.getStack()

const tier = cfg.require("tier")
const mercurVersion = cfg.require("mercurVersion")
const medusaVersion = cfg.get("medusaVersion") ?? "2.21.2"
const apiCount = cfg.getNumber("apiCount") ?? 2
const apiCpu = cfg.get("apiCpu") ?? "1024"
const apiMemory = cfg.get("apiMemory") ?? "2048"
const dbInstanceClass = cfg.get("dbInstanceClass") ?? "db.m6g.xlarge"
const redisNodeType = cfg.get("redisNodeType") ?? "cache.m6g.large"
const k6Generator = cfg.getBoolean("k6Generator") ?? true
const k6InstanceType = cfg.get("k6InstanceType") ?? "c7g.xlarge"
const dbPoolMax = cfg.get("dbPoolMax") ?? "20"
// Set to skip the local docker build and deploy an already pushed image.
const imageUriOverride = cfg.get("imageUri")

const tags = { project: "mercur-bench", stack, tier }

// ─── Network ────────────────────────────────────────────────────────────────
// RDS subnet groups need two AZs even for a single-AZ instance, so the VPC
// spans two. The DB and cache are still single-node.
const vpc = new awsx.ec2.Vpc("vpc", {
  numberOfAvailabilityZones: 2,
  natGateways: { strategy: awsx.ec2.NatGatewayStrategy.Single },
  tags,
})

const albSg = new aws.ec2.SecurityGroup("alb-sg", {
  vpcId: vpc.vpcId,
  ingress: [{ protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] }],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags,
})

const k6Sg = new aws.ec2.SecurityGroup("k6-sg", {
  vpcId: vpc.vpcId,
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags,
})

const appSg = new aws.ec2.SecurityGroup("app-sg", {
  vpcId: vpc.vpcId,
  ingress: [
    { protocol: "tcp", fromPort: 9000, toPort: 9000, securityGroups: [albSg.id] },
  ],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags,
})

const dbSg = new aws.ec2.SecurityGroup("db-sg", {
  vpcId: vpc.vpcId,
  ingress: [
    { protocol: "tcp", fromPort: 5432, toPort: 5432, securityGroups: [appSg.id, k6Sg.id] },
  ],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags,
})

const redisSg = new aws.ec2.SecurityGroup("redis-sg", {
  vpcId: vpc.vpcId,
  ingress: [{ protocol: "tcp", fromPort: 6379, toPort: 6379, securityGroups: [appSg.id] }],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags,
})

// ─── Secrets ────────────────────────────────────────────────────────────────
const dbPassword = new random.RandomPassword("db-password", { length: 32, special: false })
const jwtSecret = new random.RandomPassword("jwt-secret", { length: 48, special: false })
const cookieSecret = new random.RandomPassword("cookie-secret", { length: 48, special: false })

// ─── Postgres ───────────────────────────────────────────────────────────────
const dbSubnets = new aws.rds.SubnetGroup("db-subnets", { subnetIds: vpc.privateSubnetIds, tags })

const dbParams = new aws.rds.ParameterGroup("pg16", {
  family: "postgres16",
  parameters: [
    { name: "shared_preload_libraries", value: "pg_stat_statements", applyMethod: "pending-reboot" },
    { name: "pg_stat_statements.track", value: "all" },
    { name: "track_io_timing", value: "1" },
  ],
  tags,
})

const db = new aws.rds.Instance("db", {
  identifierPrefix: `mercur-bench-${stack}-`,
  engine: "postgres",
  engineVersion: "16",
  instanceClass: dbInstanceClass,
  allocatedStorage: 100,
  storageType: "gp3",
  multiAz: false,
  dbName: "mercur",
  username: "mercur",
  password: dbPassword.result,
  parameterGroupName: dbParams.name,
  dbSubnetGroupName: dbSubnets.name,
  vpcSecurityGroupIds: [dbSg.id],
  performanceInsightsEnabled: true,
  performanceInsightsRetentionPeriod: 7,
  publiclyAccessible: false,
  skipFinalSnapshot: true,
  applyImmediately: true,
  tags,
})

const databaseUrl = pulumi.interpolate`postgres://mercur:${dbPassword.result}@${db.address}:${db.port}/mercur`

// ─── Redis ──────────────────────────────────────────────────────────────────
const redisSubnets = new aws.elasticache.SubnetGroup("redis-subnets", {
  subnetIds: vpc.privateSubnetIds,
  tags,
})

const redis = new aws.elasticache.Cluster("redis", {
  engine: "redis",
  engineVersion: "7.1",
  nodeType: redisNodeType,
  numCacheNodes: 1,
  parameterGroupName: "default.redis7",
  subnetGroupName: redisSubnets.name,
  securityGroupIds: [redisSg.id],
  tags,
})

const redisUrl = pulumi.interpolate`redis://${redis.cacheNodes[0].address}:${redis.cacheNodes[0].port}`

// ─── Image ──────────────────────────────────────────────────────────────────
const repo = new awsx.ecr.Repository("repo", { forceDelete: true, tags })

const imageUri: pulumi.Output<string> = imageUriOverride
  ? pulumi.output(imageUriOverride)
  : new awsx.ecr.Image("api-image", {
      repositoryUrl: repo.url,
      context: "../..",
      dockerfile: "../docker/Dockerfile",
      platform: "linux/arm64",
      args: { MERCUR_VERSION: mercurVersion, MEDUSA_VERSION: medusaVersion },
      imageTag: `${mercurVersion}-${Date.now()}`,
    }).imageUri

// ─── ECS ────────────────────────────────────────────────────────────────────
const cluster = new aws.ecs.Cluster("cluster", {
  settings: [{ name: "containerInsights", value: "enabled" }],
  tags,
})

const logGroup = new aws.cloudwatch.LogGroup("logs", { retentionInDays: 7, tags })

const alb = new awsx.lb.ApplicationLoadBalancer("alb", {
  subnetIds: vpc.publicSubnetIds,
  securityGroups: [albSg.id],
  defaultTargetGroup: {
    port: 9000,
    protocol: "HTTP",
    targetType: "ip",
    deregistrationDelay: 10,
    healthCheck: { path: "/health", interval: 15, healthyThreshold: 2, unhealthyThreshold: 3 },
  },
  listener: { port: 80, protocol: "HTTP" },
  tags,
})

const baseEnv = (mode: "server" | "worker" | "shared") => [
  { name: "NODE_ENV", value: "production" },
  { name: "WORKER_MODE", value: mode },
  { name: "PORT", value: "9000" },
  { name: "DATABASE_URL", value: databaseUrl },
  { name: "REDIS_URL", value: redisUrl },
  { name: "JWT_SECRET", value: jwtSecret.result },
  { name: "COOKIE_SECRET", value: cookieSecret.result },
  { name: "DB_POOL_MAX", value: dbPoolMax },
  { name: "BENCH_TIER", value: tier },
  // Toggle per run via `pulumi config set cacheEnabled true|false`.
  { name: "MEDUSA_FF_CACHING", value: cfg.get("cacheEnabled") ?? "false" },
]

const logConfiguration = (stream: string) => ({
  logDriver: "awslogs",
  options: {
    "awslogs-group": logGroup.name,
    "awslogs-region": aws.config.region!,
    "awslogs-stream-prefix": stream,
  },
})

const arm = { operatingSystemFamily: "LINUX", cpuArchitecture: "ARM64" }

const api = new awsx.ecs.FargateService("api", {
  cluster: cluster.arn,
  desiredCount: apiCount,
  networkConfiguration: { subnets: vpc.privateSubnetIds, securityGroups: [appSg.id] },
  deploymentMinimumHealthyPercent: 50,
  taskDefinitionArgs: {
    cpu: apiCpu,
    memory: apiMemory,
    runtimePlatform: arm,
    container: {
      name: "api",
      image: imageUri,
      essential: true,
      environment: baseEnv("server"),
      portMappings: [{ containerPort: 9000, targetGroup: alb.defaultTargetGroup }],
      logConfiguration: logConfiguration("api"),
    },
  },
  tags,
})

const worker = new awsx.ecs.FargateService("worker", {
  cluster: cluster.arn,
  desiredCount: 1,
  networkConfiguration: { subnets: vpc.privateSubnetIds, securityGroups: [appSg.id] },
  taskDefinitionArgs: {
    cpu: apiCpu,
    memory: apiMemory,
    runtimePlatform: arm,
    container: {
      name: "worker",
      image: imageUri,
      essential: true,
      environment: baseEnv("worker"),
      logConfiguration: logConfiguration("worker"),
    },
  },
  tags,
})

// One-off task definition for migrations and seeding. Run with
// `bun run task migrate` / `bun run task seed` (scripts/run-task.ts), which
// overrides the command.
const ops = new awsx.ecs.FargateTaskDefinition("ops", {
  cpu: "2048",
  memory: "4096",
  runtimePlatform: arm,
  container: {
    name: "ops",
    image: imageUri,
    essential: true,
    environment: baseEnv("shared"),
    command: ["npx", "medusa", "db:migrate", "--execute-safe-links", "--execute-safe-search"],
    logConfiguration: logConfiguration("ops"),
  },
  tags,
})

// ─── k6 generator ───────────────────────────────────────────────────────────
let k6InstanceId: pulumi.Output<string> | undefined
let k6PublicIp: pulumi.Output<string> | undefined

if (k6Generator) {
  const ami = aws.ec2.getAmiOutput({
    mostRecent: true,
    owners: ["amazon"],
    filters: [
      { name: "name", values: ["al2023-ami-2023*-arm64"] },
      { name: "architecture", values: ["arm64"] },
    ],
  })

  const role = new aws.iam.Role("k6-role", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "ec2.amazonaws.com" }),
    managedPolicyArns: ["arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"],
    tags,
  })
  const profile = new aws.iam.InstanceProfile("k6-profile", { role: role.name })

  const userData = `#!/bin/bash
set -euxo pipefail
dnf install -y git postgresql16
curl -fsSL https://dl.k6.io/rpm/repo.rpm -o /tmp/k6.rpm && rpm -i /tmp/k6.rpm
dnf install -y k6
mkdir -p /opt/bench/results
echo 'export K6_ENDPOINT=http://${alb.loadBalancer.dnsName}' > /etc/profile.d/bench.sh
`

  const k6 = new aws.ec2.Instance("k6", {
    ami: ami.id,
    instanceType: k6InstanceType,
    subnetId: vpc.publicSubnetIds[0],
    vpcSecurityGroupIds: [k6Sg.id],
    iamInstanceProfile: profile.name,
    associatePublicIpAddress: true,
    userData: pulumi.interpolate`${userData}`,
    rootBlockDevice: { volumeSize: 30, volumeType: "gp3" },
    tags: { ...tags, Name: `mercur-bench-${stack}-k6` },
  })

  k6InstanceId = k6.id
  k6PublicIp = k6.publicIp
}

// ─── Outputs ────────────────────────────────────────────────────────────────
export const apiUrl = pulumi.interpolate`http://${alb.loadBalancer.dnsName}`
export const clusterArn = cluster.arn
export const opsTaskDefinitionArn = ops.taskDefinition.arn
export const privateSubnetIds = vpc.privateSubnetIds
export const appSecurityGroupId = appSg.id
export const dbEndpoint = db.address
export const redisEndpoint = redis.cacheNodes[0].address
export const image = imageUri
export const repositoryUrl = repo.url
export const apiServiceName = api.service.name
export const workerServiceName = worker.service.name
export const k6Instance = k6InstanceId
export const k6Ip = k6PublicIp
export const databaseUrlSecret = pulumi.secret(databaseUrl)
