import { execSync } from "node:child_process"
import { createHash } from "node:crypto"

const PROJECT_ID_SALT = "mercur-telemetry-v1"

export const hashProjectKey = (input: string) =>
  createHash("sha256").update(`${PROJECT_ID_SALT}:${input}`).digest("base64url")

const gitRemote = (cwd: string) => {
  try {
    return execSync("git config --local --get remote.origin.url", {
      cwd,
      stdio: "pipe",
      timeout: 1_000,
    })
      .toString()
      .trim()
  } catch {
    return null
  }
}

/**
 * Stable, irreversible id for the codebase an instance was built from. Shared
 * with the CLI so a scaffolded project can be matched to its running server.
 */
export function resolveProjectId(cwd = process.cwd()): string {
  const remote = gitRemote(cwd)
  return hashProjectKey(remote || cwd)
}
