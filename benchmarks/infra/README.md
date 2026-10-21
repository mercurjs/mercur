# Mercur benchmark environment (Pulumi, AWS)

Stands up the environment described in `docs/specs/SPEC-002-k6-load-benchmark.md`:

- VPC (2 AZs, one NAT), ALB on port 80
- ECS Fargate on ARM64: N `WORKER_MODE=server` tasks behind the ALB, 1 `worker` task, and an `ops` task definition for migrations and seeding
- RDS PostgreSQL 16, single AZ, gp3, `pg_stat_statements` + Performance Insights
- ElastiCache Redis 7, single node
- Optional EC2 k6 generator (Amazon Linux 2023, arm64, SSM access, no SSH key)

The API image is a pure consumer of the published `@mercurjs/*` packages
(`benchmarks/docker/`), so the version under test is a release, not a
workspace build. `mercurVersion` in the stack config picks it.

## Prerequisites

- `pulumi` (Homebrew), AWS credentials in `~/.aws` with rights for VPC, ECS, RDS, ElastiCache, ECR, EC2, IAM, CloudWatch
- A Pulumi backend: `pulumi login` (Pulumi Cloud) or `pulumi login s3://<bucket>` or `pulumi login --local`
- An image. Either a local Docker daemon (Docker Desktop, OrbStack, or `brew install colima docker && colima start --arch aarch64`) so `pulumi up` builds and pushes it, or the **Benchmark image** GitHub Actions workflow (`.github/workflows/benchmark-image.yml`), which builds on a GitHub ARM runner and pushes to the stack's ECR repo. Then `pulumi config set imageUri <uri>` and the local build is skipped.

## Stacks

| Stack | Purpose | Config file |
|---|---|---|
| `bench-small` | script development, race tests, CI gate | `Pulumi.bench-small.yaml` |
| `bench-mid` | the published baseline | `Pulumi.bench-mid.yaml` |

## Bring it up

```bash
cd benchmarks/infra
bun install
pulumi stack select bench-small --create
pulumi preview
pulumi up
```

Without local Docker, do it in two passes: first `pulumi up` with
`pulumi config set imageUri public.ecr.aws/docker/library/busybox:latest`
to create the ECR repo (the ECS tasks will fail, that is fine), run the
**Benchmark image** workflow with `pulumi stack output repositoryUrl`, then
`pulumi config set imageUri <printed uri>` and `pulumi up` again.

Then migrate and seed through the `ops` task (uses the AWS SDK, so it works even if the `aws` CLI is broken locally):

```bash
bun run task migrate
bun run task seed small       # once seed-benchmark.ts exists in the image
```

`pulumi stack output apiUrl` is the ALB. `curl $(pulumi stack output apiUrl)/health` should return `OK`.

## Toggle cache between runs

```bash
pulumi config set cacheEnabled true && pulumi up   # redeploys api + worker with MEDUSA_FF_CACHING=true
```

## Run k6 from the generator

```bash
aws ssm start-session --target $(pulumi stack output k6Instance)
# on the instance
source /etc/profile.d/bench.sh
git clone https://github.com/mercurjs/mercur /opt/bench/mercur
k6 run /opt/bench/mercur/benchmarks/k6/main.js -e K6_ENDPOINT=$K6_ENDPOINT -e K6_TIER=small \
  --summary-export=/opt/bench/results/$(date +%F)-small.json
```

Add `--out experimental-prometheus-rw` with `K6_PROMETHEUS_RW_SERVER_URL` and credentials to stream into Grafana Cloud.

## Reset between runs

Keep the catalog, clear the transactional tables. Until the reset script exists, the fastest reset is `pulumi destroy` of the `db` resource only:

```bash
pulumi destroy --target urn:pulumi:bench-small::mercur-bench::aws:rds/instance:Instance::db
pulumi up && bun run task migrate && bun run task seed small
```

## Tear down

```bash
pulumi destroy
```

RDS has `skipFinalSnapshot: true`. Take a manual snapshot first if you want to keep a seeded database.

## Cost notes

`bench-mid` is roughly: RDS `db.m6g.xlarge` ~$0.37/h, ElastiCache `cache.m6g.large` ~$0.16/h, 3 Fargate tasks ~$0.15/h, NAT ~$0.05/h, k6 `c7g.xlarge` ~$0.15/h. Under $1/h while running; destroy when idle.
