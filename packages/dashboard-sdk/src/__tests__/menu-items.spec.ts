import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, test } from "vitest"
import { parseMenuItemFile } from "../menu-items"

const tmpDirs: string[] = []

const writeRoute = (route: string, source: string) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mercur-menu-items-"))
  tmpDirs.push(root)
  const routesDir = path.join(root, "src", "routes")
  const file = path.join(routesDir, route, "page.tsx")
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, source)
  return { file, routesDir }
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

describe("parseMenuItemFile", () => {
  test("extracts the settings group from the route config", () => {
    const { file, routesDir } = writeRoute(
      "settings/webhooks",
      `import type { RouteConfig } from "@mercurjs/dashboard-sdk"
export const config: RouteConfig = { label: "Webhooks", group: "developer" }
export default () => null
`
    )

    expect(parseMenuItemFile(file, routesDir, 0)?.menuItem).toMatchObject({
      path: "/settings/webhooks",
      group: "developer",
    })
  })

  test("leaves the group undefined when the config has none", () => {
    const { file, routesDir } = writeRoute(
      "settings/erp",
      `export const config = { label: "ERP" }
export default () => null
`
    )

    expect(parseMenuItemFile(file, routesDir, 0)?.menuItem.group).toBeUndefined()
  })
})
