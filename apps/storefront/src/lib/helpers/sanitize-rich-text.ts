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

export const isRichText = (value: string) => /<[a-z!/?]/i.test(value)

export const sanitizeRichText = (value: string) =>
  sanitizeHtml(value, RICH_TEXT_OPTIONS)
