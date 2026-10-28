import { Container, Heading, StatusBadge } from "@medusajs/ui"
import { SectionRow, useDate } from "@mercurjs/dashboard-shared"

import type { SettlementDetail } from "../../../../../../lib/client"
import { PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL, formatSettlementPayout, statusProps } from "../../../../../../lib/status"

export const SettlementBankPayoutSection = ({ settlement }: { settlement: SettlementDetail }) => {
  const { getFullDate } = useDate()
  const status = settlement.payout_status
    ? statusProps(settlement.payout_status, PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL)
    : null

  return (
    <Container className="divide-y p-0" data-testid="stripe-settlement-bank-payout-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="stripe-settlement-bank-payout-heading">
          Bank payout
        </Heading>
        {status ? <StatusBadge color={status.color}>{status.label}</StatusBadge> : null}
      </div>
      {settlement.payout_amount != null ? (
        <SectionRow title="Paid out" value={formatSettlementPayout(settlement)} />
      ) : null}
      <SectionRow title="Stripe payout" value={settlement.provider_payout_id ?? "-"} />
      <SectionRow title="Updated" value={getFullDate({ date: settlement.updated_at, includeTime: true })} />
    </Container>
  )
}
