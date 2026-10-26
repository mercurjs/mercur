import { Badge, Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SectionRow } from "../../../../components/common/section"
import { AdminSettlement } from "../../../../hooks/api/settlements"
import { useDate } from "../../../../hooks/use-date"
import { getStylizedAmount } from "../../../../lib/money-amount-helpers"
import { getSettlementStatusProps } from "../../common/utils"

export const SettlementGeneralSection = ({
  settlement,
}: {
  settlement: AdminSettlement
}) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  const status = getSettlementStatusProps(settlement.status, t)
  const amount = (value: unknown) =>
    getStylizedAmount(Number(value ?? 0), settlement.currency_code)
  const date = (value: Date | string | null | undefined) =>
    value ? getFullDate({ date: value, includeTime: false }) : "-"

  return (
    <Container className="divide-y p-0" data-testid="settlement-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading data-testid="settlement-general-section-heading">
            #{settlement.display_id}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("settlements.period", {
              start: date(settlement.period_start),
              end: date(settlement.period_end),
            })}
          </Text>
        </div>
        <StatusBadge
          color={status.color}
          data-testid="settlement-general-section-status-badge"
        >
          {status.label}
        </StatusBadge>
      </div>
      <SectionRow title={t("fields.amount")} value={amount(settlement.amount)} />
      <SectionRow
        title={t("settlements.fields.transfersTotal")}
        value={amount(settlement.transfers_total)}
      />
      <SectionRow
        title={t("settlements.fields.reversalsTotal")}
        value={`-${amount(settlement.reversals_total)}`}
      />
      <SectionRow
        title={t("settlements.fields.adjustmentsTotal")}
        value={amount(settlement.adjustments_total)}
      />
      <SectionRow
        title={t("fields.currency")}
        value={<Badge size="2xsmall">{settlement.currency_code.toUpperCase()}</Badge>}
      />
      <SectionRow
        title={t("settlements.fields.provider")}
        value={<Badge size="2xsmall">{settlement.provider_id}</Badge>}
      />
      <SectionRow
        title={t("fields.createdAt")}
        value={getFullDate({ date: settlement.created_at, includeTime: true })}
      />
      <SectionRow
        title={t("fields.updatedAt")}
        value={getFullDate({ date: settlement.updated_at, includeTime: true })}
      />
    </Container>
  )
}
