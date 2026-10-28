import { Alert, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { AdminPayout } from "../../../../lib/payouts"
import {
  getPayoutStatusDetail,
  getPayoutStatusReasonLabel,
} from "../../common/utils"

const variantForStatus = (status: string) => {
  switch (status) {
    case "failed":
    case "aborted":
      return "error"
    case "on_hold":
      return "warning"
    default:
      return "info"
  }
}

export const PayoutStatusAlert = ({ payout }: { payout: AdminPayout }) => {
  const { t } = useTranslation()

  if (!payout.status_reason) {
    return null
  }

  const detail = getPayoutStatusDetail(payout.data)

  return (
    <Alert
      variant={variantForStatus(payout.status)}
      data-testid="payout-status-alert"
    >
      <div className="flex flex-col gap-y-1">
        <span>{getPayoutStatusReasonLabel(payout.status_reason, t)}</span>
        {detail && (
          <Text
            size="small"
            className="text-ui-fg-subtle"
            data-testid="payout-status-alert-detail"
          >
            {detail}
          </Text>
        )}
      </div>
    </Alert>
  )
}
