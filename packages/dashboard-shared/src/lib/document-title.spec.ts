import { describe, expect, test } from "vitest"

import {
  crumbToTitle,
  formatDocumentTitle,
  titleFromCrumbs,
} from "./document-title"

describe("crumbToTitle", () => {
  test("returns trimmed strings", () => {
    expect(crumbToTitle("  Products  ")).toBe("Products")
  })

  test("skips empty strings and non-strings", () => {
    expect(crumbToTitle("")).toBeUndefined()
    expect(crumbToTitle("   ")).toBeUndefined()
    expect(crumbToTitle(null)).toBeUndefined()
    expect(crumbToTitle({ label: "Products" })).toBeUndefined()
  })
})

describe("titleFromCrumbs", () => {
  test("uses the last string crumb", () => {
    expect(titleFromCrumbs(["Products", "Winter coat"])).toBe("Winter coat")
  })

  test("skips ReactNode crumbs", () => {
    expect(titleFromCrumbs(["Products", { type: "span" }, "SKU-1"])).toBe(
      "SKU-1"
    )
  })

  test("returns undefined when nothing is usable", () => {
    expect(titleFromCrumbs([null, "  "])).toBeUndefined()
  })
})

describe("formatDocumentTitle", () => {
  test("falls back to the app name", () => {
    expect(formatDocumentTitle(undefined, "Mercur Admin")).toBe("Mercur Admin")
    expect(formatDocumentTitle("  ", "Mercur Admin")).toBe("Mercur Admin")
  })

  test("prefixes the page title", () => {
    expect(formatDocumentTitle("Products", "Mercur Admin")).toBe(
      "Products | Mercur Admin"
    )
  })
})
