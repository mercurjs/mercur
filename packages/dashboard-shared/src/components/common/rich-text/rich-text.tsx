import { Button, Text, clx } from "@medusajs/ui"
import DOMPurify from "dompurify"
import { ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

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
  collapsedHeight?: number
  "data-testid"?: string
}

export const sanitizeRichText = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTRIBUTES,
  })

const Collapsible = ({
  collapsedHeight,
  dataTestId,
  children,
}: {
  collapsedHeight?: number
  dataTestId?: string
  children: ReactNode
}) => {
  const { t } = useTranslation()
  const contentRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const element = contentRef.current

    if (!element || !collapsedHeight) {
      return
    }

    const measure = () =>
      setIsOverflowing(element.scrollHeight > collapsedHeight)

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    Array.from(element.children).forEach((child) => observer.observe(child))

    return () => observer.disconnect()
  }, [collapsedHeight, children])

  if (!collapsedHeight) {
    return <>{children}</>
  }

  const isCollapsed = isOverflowing && !isExpanded

  return (
    <div className="flex w-full flex-col items-start gap-y-1">
      <div
        ref={contentRef}
        className={clx("relative w-full", { "overflow-hidden": isCollapsed })}
        style={isCollapsed ? { maxHeight: collapsedHeight } : undefined}
      >
        {children}
        {isCollapsed && (
          <div className="from-ui-bg-base pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t to-transparent" />
        )}
      </div>
      {isOverflowing && (
        <Button
          type="button"
          size="small"
          variant="transparent"
          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover -ml-2"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          data-testid={dataTestId ? `${dataTestId}-toggle` : undefined}
        >
          {isExpanded ? t("actions.showLess") : t("actions.showMore")}
        </Button>
      )}
    </div>
  )
}

export const RichText = ({
  html,
  className,
  fallback = "-",
  collapsedHeight,
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

  return (
    <Collapsible collapsedHeight={collapsedHeight} dataTestId={dataTestId}>
      {sanitized === null ? (
        <Text
          size="small"
          className={clx(
            "text-ui-fg-subtle whitespace-pre-line text-pretty",
            className
          )}
          data-testid={dataTestId}
        >
          {html}
        </Text>
      ) : (
        <div
          className={clx(richTextContentClasses, className)}
          data-testid={dataTestId}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      )}
    </Collapsible>
  )
}
