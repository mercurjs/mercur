import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { useRetryPayout } from "../../../../hooks/api/payouts"
import { AdminPayout } from "../../../../lib/payouts"
import { RETRYABLE_PAYOUT_STATUSES } from "../utils"

export const useRetryPayoutAction = (payout: AdminPayout) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useRetryPayout(payout.id)

  const canRetry = RETRYABLE_PAYOUT_STATUSES.includes(payout.status)

  const handleRetry = async () => {
    const confirmed = await prompt({
      title: t("payouts.retry.title"),
      description: t("payouts.retry.description"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => toast.success(t("payouts.retry.successToast")),
      onError: (error) => toast.error(error.message),
    })
  }

  return { handleRetry, canRetry }
}
