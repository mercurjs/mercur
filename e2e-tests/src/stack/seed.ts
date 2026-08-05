import { execFileSync } from "child_process"
import { E2E_ROOT } from "./paths"

export const DEFAULT_SEED_EXEC = "./seed-exec.ts"

// Seeds through `medusa exec` so the seed logic runs inside a full Medusa
// process (same reason Medusa itself is booted as a child — one module graph).
// `seedExec` is swappable so the docs guide generator can seed the richer
// apps/api demo catalog instead of the minimal login-only e2e seed.
export function runSeed(
  env: NodeJS.ProcessEnv,
  seedExec: string = DEFAULT_SEED_EXEC
): void {
  execFileSync("medusa", ["exec", seedExec], {
    cwd: E2E_ROOT,
    env,
    stdio: "inherit",
  })
}
