import { execFileSync } from "child_process"
import { E2E_ROOT } from "./paths"

// Seeds through `medusa exec` so the seed logic runs inside a full Medusa
// process (same reason Medusa itself is booted as a child — one module graph).
export function runSeed(env: NodeJS.ProcessEnv): void {
  execFileSync("medusa", ["exec", "./seed-exec.ts"], {
    cwd: E2E_ROOT,
    env,
    stdio: "inherit",
  })
}
