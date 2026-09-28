import { describe, expect, test } from "vitest"

import {
  isHtml,
  normalizeRichText,
  plainTextToHtml,
  stripHtml,
} from "./rich-text"

describe("rich-text helpers", () => {
  test("isHtml detects markup only", () => {
    expect(isHtml("<p>x</p>")).toBe(true)
    expect(isHtml("5 < 6 and 7 > 3")).toBe(false)
    expect(isHtml(null)).toBe(false)
  })

  test("plainTextToHtml converts legacy text to paragraphs", () => {
    expect(plainTextToHtml("One\nline\n\nTwo & <3")).toBe(
      "<p>One<br>line</p><p>Two &amp; &lt;3</p>"
    )
    expect(plainTextToHtml("<p>already</p>")).toBe("<p>already</p>")
    expect(plainTextToHtml(undefined)).toBe("")
  })

  test("normalizeRichText treats an empty editor document as empty", () => {
    expect(normalizeRichText("<p></p>")).toBe("")
    expect(normalizeRichText("<p><br></p>")).toBe("")
    expect(normalizeRichText('<p><img src="https://x.test/a.png"></p>')).toBe(
      '<p><img src="https://x.test/a.png"></p>'
    )
    expect(normalizeRichText("<p>text</p>")).toBe("<p>text</p>")
  })

  test("stripHtml returns readable plain text", () => {
    expect(stripHtml("<h2>Title</h2><p>a &amp; b</p><ul><li>x</li></ul>")).toBe(
      "Title\na & b\nx"
    )
  })
})
