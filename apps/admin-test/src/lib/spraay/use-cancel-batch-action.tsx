import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { useCancelSpraayBatch, type SpraayBatch } from "./api"

export const useCancelBatchAction = () => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync, isPending } = useCancelSpraayBatch()

  const cancel = async (batch: Pick<SpraayBatch, "id" | "status" | "unsigned_tx_nonce">) => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description:
        batch.status === "awaiting_signature"
          ? t("spraay.cancel.descriptionPrepared", { id: batch.id, nonce: batch.unsigned_tx_nonce })
          : t("spraay.cancel.description", { id: batch.id }),
      confirmText: t("spraay.cancel.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await mutateAsync(batch.id, {
      onSuccess: ({ payouts_released }) => {
        toast.success(payouts_released ? t("spraay.cancel.successReleased") : t("spraay.cancel.successHeld"))
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return { cancel, isPending }
}
