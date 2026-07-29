import { spawn, execFileSync } from "child_process"
import { existsSync } from "fs"
import { resolve } from "path"
import { E2E_ROOT } from "./paths"

export interface MedusaHandle {
  url: string
  port: number
  shutdown: () => Promise<void>
}

async function waitForHealth(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        return
      }
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Medusa did not become healthy at ${url} within ${timeoutMs}ms`)
}

// `medusa start` is used instead of `medusa develop`: develop's file watchers
// exhaust the macOS kqueue watch limit (EMFILE) on a repo this size. start has
// no watchers but needs a prior build, so we build once and reuse it.
export function ensureBuild(env: NodeJS.ProcessEnv): void {
  if (existsSync(resolve(E2E_ROOT, ".medusa", "server"))) {
    return
  }
  execFileSync("medusa", ["build"], { cwd: E2E_ROOT, env, stdio: "inherit" })
}

// Medusa is booted as a child process (the supported boot path) rather than
// in-process: mixing @medusajs/test-utils' startApp with the workspace build
// splits the config singleton and the Seller loader crashes. A child process
// resolves one consistent module graph. cwd is the e2e project — apps/ untouched.
export async function startMedusa(
  env: NodeJS.ProcessEnv,
  port: number
): Promise<MedusaHandle> {
  ensureBuild(env)

  const child = spawn("medusa", ["start"], {
    cwd: E2E_ROOT,
    env: { ...env, PORT: String(port) },
    stdio: ["ignore", "inherit", "inherit"],
  })

  const url = `http://localhost:${port}`
  await waitForHealth(`${url}/health`, 180_000)

  return {
    url,
    port,
    shutdown: async () => {
      child.kill("SIGTERM")
    },
  }
}
