import sanitizeHtml from "sanitize-html"

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
  allowProtocolRelative: false,
  exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer nofollow",
      target: "_blank",
    }),
  },
}

const MARKUP_REGEX = /<[a-z!/?]/i

// Plain-text descriptions are stored untouched: sanitize-html would entity-encode them.
export const sanitizeRichText = (value: string): string =>
  MARKUP_REGEX.test(value)
    ? sanitizeHtml(value, RICH_TEXT_OPTIONS).trim()
    : value

export const sanitizeNullableRichText = <T extends string | null | undefined>(
  value: T
): T => (typeof value === "string" ? (sanitizeRichText(value) as T) : value)
