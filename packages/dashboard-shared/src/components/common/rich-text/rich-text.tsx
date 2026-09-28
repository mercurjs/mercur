import { Text, clx } from "@medusajs/ui"
import DOMPurify from "dompurify"
import { useMemo } from "react"

import {
  RICH_TEXT_ALLOWED_ATTRIBUTES,
  RICH_TEXT_ALLOWED_TAGS,
  isHtml,
} from "../../../lib/rich-text"
import { richTextContentClasses } from "./rich-text-content-classes"

type RichTextProps = {
  html?: string | null
  className?: string
  fallback?: string
  "data-testid"?: string
}

export const sanitizeRichText = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTRIBUTES,
  })

export const RichText = ({
  html,
  className,
  fallback = "-",
  "data-testid": dataTestId,
}: RichTextProps) => {
  const sanitized = useMemo(
    () => (html && isHtml(html) ? sanitizeRichText(html) : null),
    [html]
  )

  if (!html) {
    return (
      <Text
        size="small"
        leading="compact"
        className={clx("text-ui-fg-subtle", className)}
        data-testid={dataTestId}
      >
        {fallback}
      </Text>
    )
  }

  if (sanitized === null) {
    return (
      <Text
        size="small"
        className={clx("text-ui-fg-subtle whitespace-pre-line text-pretty", className)}
        data-testid={dataTestId}
      >
        {html}
      </Text>
    )
  }

  return (
    <div
      className={clx(richTextContentClasses, className)}
      data-testid={dataTestId}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
