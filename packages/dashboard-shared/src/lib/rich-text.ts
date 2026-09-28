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

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*?>/i

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

export const stripHtml = (value?: string | null): string => {
  if (!value) {
    return ""
  }

  return value
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/blockquote)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// Tiptap serializes an empty document as `<p></p>`.
export const normalizeRichText = (value?: string | null): string => {
  if (!value) {
    return ""
  }

  const hasMedia = /<img\s/i.test(value)

  if (!hasMedia && !stripHtml(value)) {
    return ""
  }

  return value.trim()
}
