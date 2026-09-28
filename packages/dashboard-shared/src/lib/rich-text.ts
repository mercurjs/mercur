export const RICH_TEXT_ALLOWED_TAGS = [
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
]

export const RICH_TEXT_ALLOWED_ATTRIBUTES = ["href", "target", "rel", "src", "alt"]

const HTML_TAG_REGEX = /<\/?[a-z][^<>]*>/i

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

export const isHtml = (value?: string | null): boolean =>
  !!value && HTML_TAG_REGEX.test(value)

export const plainTextToHtml = (value?: string | null): string => {
  if (!value) {
    return ""
  }

  if (isHtml(value)) {
    return value
  }

  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("")
}
