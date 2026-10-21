# Benchmark handoff

State of the k6 / AWS benchmark work on branch `chore/k6-benchmark-infra`,
written so it can be picked up on another machine. The full plan is
`benchmarks/SPEC.md` (SPEC-002). `docs/specs/` is gitignored on `main`, which
is why the spec lives here.

## What is done

- `benchmarks/SPEC.md`: dataset tiers, 7 closed-model scenarios (Medusa parity),
  open-model burst profile, 4 race tests, Postgres oracle, metrics, thresholds,
  required runs, target version `2.3.8-canary.4`.
- `benchmarks/docker/`: Dockerfile + minimal consumer project. Installs the
  published `@mercurjs/core` at `MERCUR_VERSION`, runs `medusa build`, starts
  with `medusa start`. Worker mode, pool size, cache flag from env.
- `benchmarks/infra/`: Pulumi (TypeScript). VPC, ALB, ECS Fargate ARM64
  (server x N, worker x 1, `ops` task def), RDS pg16 single-AZ with
  `pg_stat_statements` + Performance Insights, ElastiCache Redis 7, EC2 k6
  generator with SSM. Stacks `bench-small` and `bench-mid`.
  `bun run task migrate|seed <tier>` runs the ops task via the AWS SDK.
- `.github/workflows/benchmark-image.yml`: builds the image on a GitHub ARM
  runner and pushes to the stack's ECR repo, so no local Docker is needed.

Verified on 2026-10-21: `tsc --noEmit` clean in `benchmarks/infra`;
`pulumi preview` on `bench-small` against a real account in `eu-central-1`
plans 69 resources with no errors. **Nothing has been deployed yet.**

## What is not done (in order)

1. `benchmarks/docker/api/src/scripts/seed-benchmark.ts`. The image builds
   without it; `bun run task seed` has nothing to run until it exists. Shape
   and counts are in SPEC.md "Dataset". It must also write
   `benchmarks/data/<tier>.json` (ids, publishable key, vendor JWTs) for k6.
2. `benchmarks/k6/` scripts: `main.js`, `burst.js`, `race/*`, flows.
3. `benchmarks/oracle/reconcile.ts` + SQL.
4. A reset script (truncate carts, orders, order groups, payment collections,
   commission lines; keep the catalog).
5. First recorded runs and the Baseline table in `docs/PERFORMANCE.md`.

## Running it on a fresh machine

```bash
git clone https://github.com/mercurjs/mercur && cd mercur
git checkout chore/k6-benchmark-infra
brew install pulumi k6            # macOS; see pulumi.com/docs/install otherwise
cd benchmarks/infra && bun install
```

AWS credentials in `~/.aws` (or env) for an account where you may create
VPC, EC2, ECS, ECR, RDS, ElastiCache, IAM, CloudWatch resources.

Pulumi backend: `pulumi login` (Pulumi Cloud) is the easy path for a shared
stack. The stack config files carry no `encryptionsalt`, so they work with
any backend. If you use the local backend, export
`PULUMI_CONFIG_PASSPHRASE` in every shell.

### Image

Option A, local Docker: `pulumi up` builds and pushes.

Option B, no Docker:

1. `pulumi stack select bench-small --create`
2. `pulumi config set imageUri public.ecr.aws/docker/library/busybox:latest`
3. `pulumi up` (creates everything incl. the ECR repo; tasks crash, expected)
4. In GitHub: Actions → "Benchmark image" → run with
   `ecr_repository = $(pulumi stack output repositoryUrl)`. Needs repo
   secrets `BENCH_AWS_ROLE_ARN` (OIDC) or
   `BENCH_AWS_ACCESS_KEY_ID`/`BENCH_AWS_SECRET_ACCESS_KEY`, and optional
   variable `BENCH_AWS_REGION`.
5. `pulumi config set imageUri <uri printed by the workflow>` and `pulumi up`.

### Deploy, migrate, check

```bash
pulumi up
bun run task migrate
curl $(pulumi stack output apiUrl)/health     # OK
```

API tasks crash-loop until the migration has run; they recover on their own.

### Cache toggle

```bash
pulumi config set cacheEnabled true && pulumi up
```

### k6

```bash
aws ssm start-session --target $(pulumi stack output k6Instance)
source /etc/profile.d/bench.sh
git clone https://github.com/mercurjs/mercur /opt/bench/mercur
k6 run /opt/bench/mercur/benchmarks/k6/main.js -e K6_ENDPOINT=$K6_ENDPOINT -e K6_TIER=small
```

(Scripts do not exist yet, see "not done".)

### Tear down

```bash
pulumi destroy
```

## Gotchas

- `medusa db:migrate` must run with `--execute-safe-links --execute-safe-search`
  or it hangs on an interactive prompt in a non-TTY task. The `ops` command
  and `run-task.ts` already pass them.
- The local `aws` CLI on the original machine is broken (`_cffi_backend`);
  `run-task.ts` uses the AWS SDK instead. `aws ssm start-session` for the k6
  box does need a working CLI plus the Session Manager plugin.
- Fargate tasks are ARM64; the Dockerfile and workflow build `linux/arm64`.
  If you build locally on x86 without buildx emulation, change
  `runtimePlatform` in `index.ts` to X86_64 as well.
- RDS has `skipFinalSnapshot: true`; snapshot manually before `destroy` if the
  seeded database should survive.
- `benchmarks/` is outside the Bun workspace globs; root `bun run build` and
  `bun run lint` ignore it.
