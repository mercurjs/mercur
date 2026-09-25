import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

const targets = fs.readFileSync(
  path.join(__dirname, "..", "extension-targets.d.ts"),
  "utf-8"
)

describe("extension targets", () => {
  test.each(["topbar.before", "topbar.after"])(
    "registers the %s widget zone",
    (zone) => {
      expect(targets).toContain(`"${zone}": true`)
    }
  )
})
