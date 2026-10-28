import { Alert } from "@medusajs/ui"
import { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

import { AdminPayoutAccount } from "../../../../lib/payouts"

// Providers report why an account cannot be paid out as a dotted code
// (`requirements.past_due`, `rejected.fraud`, ...); only its family matters here.
const disabledReasonMessage = (reason: string, t: TFunction) => {
  if (reason === "requirements.past_due") {
    return t("payoutAccounts.disabledReason.pastDue")
  }
  if (reason === "requirements.pending_verification") {
    return t("payoutAccounts.disabledReason.pendingVerification")
  }
  if (reason.startsWith("requirements.")) {
    return t("payoutAccounts.disabledReason.requirements")
  }
  if (reason.startsWith("rejected.")) {
    return t("payoutAccounts.disabledReason.rejected")
  }
  if (reason === "under_review" || reason === "listed") {
    return t("payoutAccounts.disabledReason.underReview")
  }
  return t("payoutAccounts.disabledReason.other")
}

export const PayoutAccountStatusAlert = ({
  account,
}: {
  account: AdminPayoutAccount
}) => {
  const { t } = useTranslation()

  if (!account.disabled_reason) {
    return null
  }

  return (
    <Alert
      variant={account.disabled_reason.startsWith("rejected.") ? "error" : "warning"}
      data-testid="payout-account-status-alert"
    >
      {disabledReasonMessage(account.disabled_reason, t)}
    </Alert>
  )
}
