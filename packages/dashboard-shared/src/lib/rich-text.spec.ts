import { describe, expect, test } from "vitest"

import { isHtml, plainTextToHtml } from "./rich-text"

describe("rich-text helpers", () => {
  test("isHtml detects markup only", () => {
    expect(isHtml("<p>x</p>")).toBe(true)
    expect(isHtml("5 < 6 and 7 > 3")).toBe(false)
    expect(isHtml(null)).toBe(false)
    expect(isHtml("<a".repeat(50000))).toBe(false)
  })

  test("plainTextToHtml converts legacy text to paragraphs", () => {
    expect(plainTextToHtml("One\nline\n\nTwo & <3")).toBe(
      "<p>One<br>line</p><p>Two &amp; &lt;3</p>"
    )
    expect(plainTextToHtml("<p>already</p>")).toBe("<p>already</p>")
    expect(plainTextToHtml(undefined)).toBe("")
  })
})
