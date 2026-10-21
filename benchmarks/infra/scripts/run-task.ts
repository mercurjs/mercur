// Runs the "ops" task definition with a command override and waits for it.
//
//   bun run task migrate
//   bun run task seed small
//   bun run task -- npx medusa exec ./src/scripts/seed-benchmark.ts mid
//
// Reads stack outputs through `pulumi stack output`, so run it from
// benchmarks/infra with the right stack selected.

import { execFileSync } from "node:child_process"
import {
  DescribeTasksCommand,
  ECSClient,
  RunTaskCommand,
  waitUntilTasksStopped,
} from "@aws-sdk/client-ecs"

type Outputs = {
  clusterArn: string
  opsTaskDefinitionArn: string
  privateSubnetIds: string[]
  appSecurityGroupId: string
}

const PRESETS: Record<string, string[]> = {
  migrate: ["npx", "medusa", "db:migrate", "--execute-safe-links", "--execute-safe-search"],
  seed: ["npx", "medusa", "exec", "./src/scripts/seed-benchmark.ts"],
}

const argv = process.argv.slice(2)
if (argv.length === 0) {
  console.error("usage: bun run task <migrate|seed [tier]|-- <command...>>")
  process.exit(2)
}

const command = PRESETS[argv[0]] ? [...PRESETS[argv[0]], ...argv.slice(1)] : argv.filter((a) => a !== "--")

const outputs = JSON.parse(
  execFileSync("pulumi", ["stack", "output", "--json"], { encoding: "utf8" })
) as Outputs

const region = execFileSync("pulumi", ["config", "get", "aws:region"], { encoding: "utf8" }).trim()
const ecs = new ECSClient({ region })

const run = await ecs.send(
  new RunTaskCommand({
    cluster: outputs.clusterArn,
    taskDefinition: outputs.opsTaskDefinitionArn,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: outputs.privateSubnetIds,
        securityGroups: [outputs.appSecurityGroupId],
        assignPublicIp: "DISABLED",
      },
    },
    overrides: { containerOverrides: [{ name: "ops", command }] },
  })
)

const taskArn = run.tasks?.[0]?.taskArn
if (!taskArn) {
  console.error("RunTask returned no task", run.failures)
  process.exit(1)
}

console.log(`started ${taskArn}\n  command: ${command.join(" ")}`)

await waitUntilTasksStopped(
  { client: ecs, maxWaitTime: 60 * 60 },
  { cluster: outputs.clusterArn, tasks: [taskArn] }
)

const { tasks } = await ecs.send(
  new DescribeTasksCommand({ cluster: outputs.clusterArn, tasks: [taskArn] })
)
const container = tasks?.[0]?.containers?.[0]
const exitCode = container?.exitCode ?? 1
console.log(`stopped: ${tasks?.[0]?.stoppedReason ?? "done"} (exit ${exitCode})`)
console.log(`logs: CloudWatch group from the stack, stream prefix ops/ops/${taskArn.split("/").pop()}`)
process.exit(exitCode)
