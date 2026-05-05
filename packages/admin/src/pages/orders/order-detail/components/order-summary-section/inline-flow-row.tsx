import { ReactNode } from "react"
import { Badge, Button, Tooltip } from "@medusajs/ui"
import { InformationCircle } from "@medusajs/icons"
import { useDate } from "../../../../../hooks/use-date"

export type InlineFlowAction = {
  label: string
  onClick: () => void
  variant?: "secondary" | "danger"
  loading?: boolean
  testId?: string
}

type InlineFlowRowProps = {
  icon: ReactNode
  label: string
  reasonChip?: { label: string; color?: "blue" | "orange" | "red" | "grey" }
  timestamp?: Date | string | null
  tooltipContent?: ReactNode
  primaryAction?: InlineFlowAction
  secondaryAction?: InlineFlowAction
  testId?: string
}

/**
 * Inline representation of an active order flow (Return / Claim /
 * Exchange / Edit) as a single Summary-card row. Replaces the
 * diagonal-striped ActiveOrder*Section banners that previously sat
 * above the Summary card. Rendered inside `OrderSummarySection`,
 * conditional on `orderPreview.order_change`.
 *
 * Composes Medusa UI primitives (Badge, Button, Tooltip) — no Radix
 * direct usage. Keyboard + focus management inherited from the
 * underlying Medusa components.
 */
export const InlineFlowRow = ({
  icon,
  label,
  reasonChip,
  timestamp,
  tooltipContent,
  primaryAction,
  secondaryAction,
  testId,
}: InlineFlowRowProps) => {
  const { getRelativeDate } = useDate()

  const time = timestamp ? getRelativeDate(timestamp) : null

  return (
    <div
      className="flex items-center gap-x-3 px-6 py-3 border-b border-dashed border-ui-border-base"
      data-testid={testId}
    >
      <div className="flex flex-1 items-center gap-x-2 text-ui-fg-base txt-small">
        <span className="text-ui-fg-subtle">↳</span>
        <span aria-hidden="true" className="text-ui-fg-subtle">
          {icon}
        </span>
        <span className="font-medium">{label}</span>
        {reasonChip && (
          <Badge size="2xsmall" rounded="full" color={reasonChip.color ?? "grey"}>
            {reasonChip.label}
          </Badge>
        )}
        {time && <span className="text-ui-fg-muted">· {time}</span>}
        {tooltipContent && (
          <Tooltip content={tooltipContent}>
            <span
              className="cursor-help text-ui-fg-muted"
              tabIndex={0}
              aria-label="Details"
            >
              <InformationCircle className="inline-block" />
            </span>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-x-2">
        {secondaryAction && (
          <Button
            variant={secondaryAction.variant ?? "secondary"}
            size="small"
            onClick={secondaryAction.onClick}
            isLoading={secondaryAction.loading}
            data-testid={secondaryAction.testId}
          >
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            variant={primaryAction.variant ?? "secondary"}
            size="small"
            onClick={primaryAction.onClick}
            isLoading={primaryAction.loading}
            data-testid={primaryAction.testId}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}
