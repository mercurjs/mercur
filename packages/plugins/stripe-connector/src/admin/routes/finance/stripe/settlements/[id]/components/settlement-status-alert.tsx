import { Alert } from "@medusajs/ui"

import type { SettlementDetail } from "../../../../../../lib/client"

export const SettlementStatusAlert = ({ settlement }: { settlement: SettlementDetail }) => {
  if (!settlement.status_reason) {
    return null
  }

  const variant = settlement.status === "failed" || settlement.payout_status === "failed" ? "error" : "warning"

  return (
    <Alert variant={variant} data-testid="stripe-settlement-status-alert">
      {settlement.status_reason}
    </Alert>
  )
}
