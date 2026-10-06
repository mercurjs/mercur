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
    "locations.list.item.before",
    "locations.list.item.after",
  ])(
    "registers the %s widget zone",
    (zone) => {
      expect(targets).toContain(`"${zone}": true`)
    }
  )
})

describe("member form zones", () => {
  test.each(["register", "invite"])("registers the %s zone", (zone) => {
    expect(targets).toMatch(
      new RegExp(`"member": \\{\\s*formZones: [^\\n]*"${zone}"`)
    )
  })
})
