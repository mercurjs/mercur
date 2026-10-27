import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { getStylizedAmount } from "@mercurjs/dashboard-shared"
import { Link } from "react-router-dom"

import {
  ADJUSTMENT_TYPE_LABEL,
  PAYOUT_STATUS_COLOR,
  PAYOUT_STATUS_LABEL,
  statusProps,
  toNumber,
} from "../../../../../../lib/status"

type Line = {
  id: string
  amount: unknown
  status: string | null
  reference: string | null
  order_id?: string | null
  order_display_id?: number | null
  type?: string
  reason?: string | null
}

type SettlementLinesSectionProps = {
  title: string
  currencyCode: string
  lines: Line[]
  testId: string
}

export const SettlementLinesSection = ({ title, currencyCode, lines, testId }: SettlementLinesSectionProps) => (
  <Container className="divide-y p-0" data-testid={testId}>
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{title}</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        {lines.length}
      </Text>
    </div>
    {lines.length ? (
      lines.map((line) => <LineRow key={line.id} line={line} currencyCode={currencyCode} />)
    ) : (
      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-muted">
          None in this period
        </Text>
      </div>
    )}
  </Container>
)

const LineRow = ({ line, currencyCode }: { line: Line; currencyCode: string }) => {
  const status = line.status ? statusProps(line.status, PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL) : null

  return (
    <div className="text-ui-fg-subtle grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-6 py-4">
      <div className="flex min-w-0 flex-col">
        <LineTitle line={line} />
        {line.reference || line.reason ? (
          <Text size="small" leading="compact" className="text-ui-fg-muted truncate">
            {line.reason ?? line.reference}
          </Text>
        ) : null}
      </div>
      {status ? (
        <StatusBadge color={status.color}>{status.label}</StatusBadge>
      ) : (
        <span />
      )}
      <Text size="small" leading="compact" className="text-right">
        {getStylizedAmount(toNumber(line.amount), currencyCode)}
      </Text>
    </div>
  )
}

const LineTitle = ({ line }: { line: Line }) => {
  if (line.order_id) {
    return (
      <Link to={`/orders/${line.order_id}`} className="txt-compact-small-plus text-ui-fg-interactive hover:text-ui-fg-interactive-hover">
        Order #{line.order_display_id ?? line.order_id}
      </Link>
    )
  }

  return (
    <Text size="small" leading="compact" weight="plus" className="text-ui-fg-base">
      {line.type ? ADJUSTMENT_TYPE_LABEL[line.type] ?? line.type : line.id}
    </Text>
  )
}
