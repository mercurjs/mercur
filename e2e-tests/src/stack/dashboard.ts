import { spawn } from "child_process"

export interface DashboardHandle {
  url: string
  port: number
  close: () => Promise<void>
}

interface StartDashboardOptions {
  root: string
  port: number
  backendUrl: string
  vendorUrl?: string
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        return
      }
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Dashboard did not become ready at ${url} within ${timeoutMs}ms`)
}

// Each dashboard runs as its own Vite child process from a host sub-package.
// This keeps the UI dependency closure (vite/react/@mercurjs/admin) out of the
// Medusa-booting e2e-tests package, which otherwise forks @medusajs/framework
// into a second copy and breaks the shared config singleton. The backend URL is
// injected via env, exactly like apps/admin-test and apps/vendor.
export async function startDashboard({
  root,
  port,
  backendUrl,
  vendorUrl,
}: StartDashboardOptions): Promise<DashboardHandle> {
  const child = spawn(
    "bun",
    ["run", "dev", "--", "--port", String(port), "--strictPort"],
    {
      cwd: root,
      env: {
        ...process.env,
        VITE_MERCUR_BACKEND_URL: backendUrl,
        ...(vendorUrl ? { VITE_MERCUR_VENDOR_URL: vendorUrl } : {}),
      },
      stdio: ["ignore", "inherit", "inherit"],
    }
  )

  const url = `http://localhost:${port}`
  await waitForServer(url, 120_000)

  return {
    url,
    port,
    close: async () => {
      child.kill("SIGTERM")
    },
  }
}
