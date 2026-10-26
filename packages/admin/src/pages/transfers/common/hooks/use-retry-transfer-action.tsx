import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { AdminTransfer, useRetryTransfer } from "../../../../hooks/api/transfers"
import { RETRYABLE_TRANSFER_STATUSES } from "../utils"

export const useRetryTransferAction = (transfer: AdminTransfer) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useRetryTransfer(transfer.id)

  const canRetry = RETRYABLE_TRANSFER_STATUSES.includes(transfer.status)

  const handleRetry = async () => {
    const confirmed = await prompt({
      title: t("transfers.retry.title"),
      description: t("transfers.retry.description"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => toast.success(t("transfers.retry.successToast")),
      onError: (error) => toast.error(error.message),
    })
  }

  return { handleRetry, canRetry }
}
