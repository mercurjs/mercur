import {
  sanitizeNullableRichText,
  sanitizeRichText,
} from "../sanitize-rich-text"

describe("sanitizeRichText", () => {
  it("keeps allowed formatting and images", () => {
    const html =
      '<h2>Title</h2><p><strong>Bold</strong> <em>it</em> <u>u</u> <s>s</s></p><ul><li><p>one</p></li></ul><blockquote><p>q</p></blockquote><p><img src="https://cdn.example.com/a.png" alt="a"></p>'

    expect(sanitizeRichText(html)).toBe(html.replace('alt="a">', 'alt="a" />'))
  })

  it("removes scripts, event handlers and unsafe urls", () => {
    expect(
      sanitizeRichText(
        '<p onclick="x()">ok</p><script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)"><a href="javascript:alert(1)">x</a><iframe src="https://evil.test"></iframe>'
      )
    ).toBe('<p>ok</p><a rel="noopener noreferrer nofollow" target="_blank">x</a>')
  })

  it("neutralizes textarea mis-close and SVG animation payloads", () => {
    expect(
      sanitizeRichText(
        "<textarea></textarea/><img src=x onerror=alert(1)></textarea>"
      )
    ).toBe('<img src="x" />')
    expect(
      sanitizeRichText(
        '<svg><a><animate attributeName="href" values="#a;javascript:alert(1)"/><text>x</text></a></svg>'
      )
    ).toBe('<a rel="noopener noreferrer nofollow" target="_blank">x</a>')
  })

  it("forces safe link attributes", () => {
    expect(sanitizeRichText('<a href="https://example.com" target="_self">x</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">x</a>'
    )
  })

  it("leaves plain text untouched", () => {
    expect(sanitizeRichText("Tom & Jerry\n5 < 6")).toBe("Tom & Jerry\n5 < 6")
  })

  it("passes null and undefined through", () => {
    expect(sanitizeNullableRichText(null)).toBeNull()
    expect(sanitizeNullableRichText(undefined)).toBeUndefined()
  })
})
