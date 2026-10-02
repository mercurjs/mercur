import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, describe, expect, test } from "vitest"
import { collectWidgets } from "../widgets"

const tmpDirs: string[] = []

const writeWidget = (source: string) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mercur-widgets-"))
  tmpDirs.push(root)
  const widgetsDir = path.join(root, "src", "widgets")
  fs.mkdirSync(widgetsDir, { recursive: true })
  fs.writeFileSync(path.join(widgetsDir, "widget.tsx"), source)
  return path.join(root, "src")
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

describe("collectWidgets", () => {
  test("carries a tab widget's label into the generated entry", () => {
    const srcDir = writeWidget(`
      export const config = defineWidgetConfig({
        zone: "stores.detail.tabs.after",
        id: "loyalty",
        label: "Loyalty",
      })
      export default () => null
    `)

    const { entries } = collectWidgets(srcDir)

    expect(entries).toHaveLength(1)
    expect(entries[0]).toContain(`zone: ["stores.detail.tabs.after"]`)
    expect(entries[0]).toContain(`widgetId: "loyalty"`)
    expect(entries[0]).toContain(`label: "Loyalty"`)
  })

  test("omits the label for a widget that declares none", () => {
    const srcDir = writeWidget(`
      export const config = defineWidgetConfig({ zone: "stores.detail.main.after" })
      export default () => null
    `)

    expect(collectWidgets(srcDir).entries[0]).not.toContain("label")
  })
})
