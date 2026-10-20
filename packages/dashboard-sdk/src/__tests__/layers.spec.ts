import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, test } from "vitest"
import { generateRoutes } from "../routes"
import { generateWidgets } from "../widgets"
import { generateNavigation } from "../navigation"
import { generateGates } from "../gates-module"
import { generatePreferences } from "../preferences-module"
import { generatePluginEntryModule } from "../generate-plugin-entry"
import type { BuiltMercurConfig } from "../types"

const tmpDirs: string[] = []

const makeDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mercur-layers-"))
  tmpDirs.push(dir)
  return dir
}

const write = (file: string, source: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, source)
}

const evaluate = async (code: string, root: string, name: string) => {
  const out = path.join(root, `${name}.ts`)
  fs.writeFileSync(out, code)
  return import(out)
}

const page = (label: string) => `
export const config = { label: "${label}" }
export default function Page() { return null }
`

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe("layers", () => {
  test("routes are emitted plugin, project, host; later layers last", async () => {
    const root = makeDir()
    const pluginSrc = path.join(root, "plugin", "src", "admin")
    write(path.join(pluginSrc, "routes", "disputes", "page.tsx"), page("Disputes"))
    const plugin = path.join(root, "plugin-entry.ts")
    fs.writeFileSync(plugin, generatePluginEntryModule(pluginSrc))

    const projectDir = path.join(root, "api", "src", "admin")
    write(path.join(projectDir, "routes", "disputes", "page.tsx"), page("Project disputes"))
    const srcDir = path.join(root, "host", "src")
    write(path.join(srcDir, "routes", "reports", "page.tsx"), page("Reports"))

    const config = { srcDir, projectDir, pluginExtensions: [plugin] } as BuiltMercurConfig
    const { customRoutes } = await evaluate(generateRoutes(config), root, "routes")

    expect(customRoutes.map((r: { path: string }) => r.path)).toEqual([
      "/disputes",
      "/disputes",
      "/reports",
    ])
  })

  test("a later widget with the same id replaces the earlier one", async () => {
    const root = makeDir()
    const pluginSrc = path.join(root, "plugin", "src", "admin")
    write(
      path.join(pluginSrc, "widgets", "a.tsx"),
      `export const config = { zone: "product.detail", id: "seller", order: -1 }
export default function PluginWidget() { return null }`
    )
    const plugin = path.join(root, "plugin-entry.ts")
    fs.writeFileSync(plugin, generatePluginEntryModule(pluginSrc))

    const srcDir = path.join(root, "host", "src")
    write(
      path.join(srcDir, "widgets", "b.tsx"),
      `export const config = { zone: "product.detail.side", id: "seller", replace: "core:ProductGeneralSection" }
export default function HostWidget() { return null }`
    )

    const config = { srcDir, pluginExtensions: [plugin] } as BuiltMercurConfig
    const { widgets } = (await evaluate(generateWidgets(config), root, "widgets")).default

    expect(widgets).toHaveLength(1)
    expect(widgets[0]).toMatchObject({
      widgetId: "seller",
      zone: ["product.detail.side"],
      replace: "core:ProductGeneralSection",
    })
    expect(widgets[0].Component.name).toBe("HostWidget")
  })

  test("navigation merges per id across layers and preferences stack in order", async () => {
    const root = makeDir()
    const pluginSrc = path.join(root, "plugin", "src", "admin")
    write(
      path.join(pluginSrc, "_navigation.ts"),
      `export default { groups: [{ id: "finance", label: "Finance" }], items: [{ id: "payouts", group: "finance", rank: 2 }] }`
    )
    write(
      path.join(pluginSrc, "_layouts.ts"),
      `export default { "product.detail": { entries: { "core:ProductMediaSection": { hidden: true } } } }`
    )
    const plugin = path.join(root, "plugin-entry.ts")
    fs.writeFileSync(plugin, generatePluginEntryModule(pluginSrc))

    const srcDir = path.join(root, "host", "src")
    write(path.join(srcDir, "_navigation.ts"), `export default { items: [{ id: "payouts", hidden: true }] }`)
    write(path.join(srcDir, "_layouts.ts"), `export default { "nav.main": { entries: { "nav:/orders": { order: 0 } } } }`)

    const config = { srcDir, pluginExtensions: [plugin] } as BuiltMercurConfig
    const navigation = (await evaluate(generateNavigation(config), root, "navigation")).default
    expect(navigation).toEqual({
      groups: [{ id: "finance", label: "Finance" }],
      items: [{ id: "payouts", group: "finance", rank: 2, hidden: true }],
    })

    const { layers } = (await evaluate(generatePreferences(config), root, "preferences")).default
    expect(layers).toEqual([
      { "product.detail": { entries: { "core:ProductMediaSection": { hidden: true } } } },
      { "nav.main": { entries: { "nav:/orders": { order: 0 } } } },
    ])
  })

  test("gates carry their id and order", async () => {
    const root = makeDir()
    const srcDir = path.join(root, "host", "src")
    write(
      path.join(srcDir, "gates", "terms.tsx"),
      `export const config = { id: "terms", order: -10 }
export default function Terms({ children }) { return children }`
    )
    write(path.join(srcDir, "gates", "licence.tsx"), `export default function Licence({ children }) { return children }`)

    const config = { srcDir, pluginExtensions: [] } as unknown as BuiltMercurConfig
    const { gates } = (await evaluate(generateGates(config), root, "gates")).default

    expect(gates.map((g: { id: string; order?: number }) => [g.id, g.order])).toEqual([
      ["licence", undefined],
      ["terms", -10],
    ])
  })
})
