import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { useDeleteOffer } from "../../../../hooks/api/offers"

export const useDeleteOfferAction = ({
  id,
  sku,
  redirectOnSuccess = false,
}: {
  id: string
  sku: string
  redirectOnSuccess?: boolean
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteOffer(id)

  return async () => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: t("offers.delete.description", { sku }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      variant: "danger",
    })

    if (!confirmed) return

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("offers.delete.successToast"))
        if (redirectOnSuccess) {
          navigate("/offers", { replace: true })
        }
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }
}
