import { ArrowUpRightOnBox } from "@medusajs/icons"
import { Badge, Container, Heading, IconButton, StatusBadge, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { NoRecords } from "../../../../components/common/empty-table-content"
import { AdminSettlement } from "../../../../hooks/api/settlements"
import { getStylizedAmount } from "../../../../lib/money-amount-helpers"
import { getTransferStatusProps, getTransferTypeLabel } from "../../../transfers/common/utils"

type Line = {
  id: string
  type: string
  amount: unknown
  status: string
  order_id?: string | null
  order_display_id?: number | null
  provider_transfer_id?: string | null
  reason?: string | null
  transfer_id?: string | null
}

type Kind = "transfers" | "reversals" | "adjustments"

export const SettlementLinesSection = ({
  settlement,
  kind,
  lines,
}: {
  settlement: AdminSettlement
  kind: Kind
  lines: Line[]
}) => {
  const { t } = useTranslation()

  const lineTitle = (line: Line) => {
    if (kind === "adjustments") {
      return t(`settlements.adjustmentType.${line.type}`, { defaultValue: line.type })
    }
    if (line.order_display_id) {
      return `#${line.order_display_id}`
    }
    return getTransferTypeLabel(line.type, t)
  }

  const lineLink = (line: Line) => {
    if (kind === "adjustments") {
      return line.transfer_id ? `/transfers/${line.transfer_id}` : null
    }
    return `/${kind === "reversals" ? "reversals" : "transfers"}/${line.id}`
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid={`settlement-${kind}-section`}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">{t(`settlements.lines.${kind}`)}</Heading>
          {lines.length > 0 && <Badge size="2xsmall">{lines.length}</Badge>}
        </div>
      </div>
      {lines.length === 0 ? (
        <NoRecords
          className="flex h-full flex-col overflow-hidden p-6"
          icon={null}
          title={t(`settlements.lines.${kind}Empty`)}
          message={t("settlements.lines.emptyMessage")}
        />
      ) : (
        lines.map((line) => {
          const status = getTransferStatusProps(line.status, t)
          const to = lineLink(line)

          return (
            <div
              key={line.id}
              className="text-ui-fg-subtle grid grid-cols-[1fr_1fr_28px] items-center gap-4 px-6 py-4"
            >
              <div className="flex flex-col">
                <Text size="small" leading="compact" weight="plus">
                  {lineTitle(line)}
                </Text>
                {(line.reason || line.provider_transfer_id) && (
                  <Text size="small" leading="compact" className="text-ui-fg-muted">
                    {line.reason ?? line.provider_transfer_id}
                  </Text>
                )}
              </div>
              <div className="flex items-center gap-x-2">
                <Text size="small" leading="compact">
                  {getStylizedAmount(Number(line.amount ?? 0), settlement.currency_code)}
                </Text>
                <StatusBadge color={status.color}>{status.label}</StatusBadge>
              </div>
              <div>
                {to && (
                  <IconButton size="small" variant="transparent" asChild>
                    <Link to={to}>
                      <ArrowUpRightOnBox />
                    </Link>
                  </IconButton>
                )}
              </div>
            </div>
          )
        })
      )}
    </Container>
  )
}
