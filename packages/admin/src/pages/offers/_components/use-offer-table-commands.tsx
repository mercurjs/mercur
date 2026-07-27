import { toast, usePrompt } from "@medusajs/ui"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useBulkDeleteOffers } from "../../../hooks/api/offers"

type OfferTableCommand = {
  label: string
  shortcut: string
  action: (selection: Record<string, boolean>) => Promise<void>
}

export const useOfferTableCommands = (options?: {
  onDeleted?: () => void
}): OfferTableCommand[] => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: bulkDelete } = useBulkDeleteOffers()
  const onDeleted = options?.onDeleted

  return useMemo(
    () => [
      {
        label: t("offers.actions.bulkDelete"),
        shortcut: "d",
        action: async (currentSelection) => {
          const offerIds = Object.keys(currentSelection)
          if (offerIds.length === 0) {
            return
          }

          const confirmed = await prompt({
            title: t("general.areYouSure"),
            description: t("offers.bulkDelete.description", {
              count: offerIds.length,
              storeName: t("offers.fields.store"),
            }),
            confirmText: t("actions.delete"),
            cancelText: t("actions.cancel"),
            variant: "danger",
          })

          if (!confirmed) {
            return
          }

          const result = await bulkDelete(offerIds)
          if (result.failed.length === 0) {
            toast.success(
              t("offers.bulkDelete.successToast", {
                count: result.succeeded.length,
              }),
            )
            onDeleted?.()
          } else {
            toast.warning(
              t("offers.bulkDelete.errorToast", {
                message: `${result.succeeded.length}/${offerIds.length} succeeded`,
              }),
            )
          }
        },
      },
    ],
    [t, prompt, bulkDelete, onDeleted],
  )
}
