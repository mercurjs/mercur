import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

const targets = fs.readFileSync(
  path.join(__dirname, "..", "extension-targets.d.ts"),
  "utf-8"
)

describe("extension targets", () => {
  test.each([
    "topbar.before",
    "topbar.after",
    "stores.detail.tabs.before",
    "stores.detail.tabs.after",
    "locations.list.item.before",
    "locations.list.item.after",
  ])(
    "registers the %s widget zone",
    (zone) => {
      expect(targets).toContain(`"${zone}": true`)
    }
  )
})

const modelBlock = (model: string) =>
  new RegExp(`\\n    "${model}": \\{\\n([\\s\\S]*?)\\n    \\}`).exec(targets)?.[1] ?? ""

describe("detail-page table zones", () => {
  test.each([
    ["product", "variants"],
    ["collection", "products"],
    ["category", "products"],
  ])("registers the %s %s table zone", (model, zone) => {
    expect(modelBlock(model)).toMatch(new RegExp(`listZones: [^\\n]*"${zone}"`))
  })

  test("reads column ids from column hooks imported through path aliases", () => {
    expect(modelBlock("collection")).toMatch(/listColumnIds: [^\n]*"status"/)
  })
})
