import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, expect, test } from "vitest"
import { createServer } from "vite"
import { mercurDashboardPlugin } from "../plugin"
import { RESOLVED_CONFIG_MODULE } from "../constants"
import type { MercurConfig } from "../types"

const roots: string[] = []

/** Reads the configuration delivered to dashboard components by the plugin. */
const dashboardConfig = async (options: Partial<MercurConfig> = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-config-"))
  roots.push(root)
  fs.mkdirSync(path.join(root, "src"))
  fs.writeFileSync(path.join(root, "medusa-config.cjs"), "module.exports = {}")
  const server = await createServer({
    root,
    configFile: false,
    mode: "production",
    plugins: [mercurDashboardPlugin({ medusaConfigPath: "medusa-config.cjs", ...options })],
    server: { middlewareMode: true },
  })
  try {
    const source = await server.environments.client.pluginContainer.load(RESOLVED_CONFIG_MODULE)
    const code = typeof source === "string" ? source : source?.code
    if (!code) throw new Error("Expected dashboard configuration module")
    return JSON.parse(code.replace(/^export default /, "")) as MercurConfig
  } finally {
    await server.close()
  }
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

test("unconfigured uploads retain the built-in image formats", async () => {
  expect((await dashboardConfig()).imageFormats).toEqual({
    "image/jpeg": [".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/heic": [".heic"],
  })
})

test("the host selects MIME types and their displayed extensions together", async () => {
  expect((await dashboardConfig({ imageFormats: { "image/png": [".png"] } })).imageFormats).toEqual({
    "image/png": [".png"],
  })
})
