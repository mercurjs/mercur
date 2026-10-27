import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { useDeleteShippingRule } from "../../../../hooks/api/shipping-rules"

type DeleteShippingRuleContext = {
  zone: string
  method: string
  profile: string
}

export const useDeleteShippingRuleAction = (
  id: string,
  context: DeleteShippingRuleContext,
  onDeleted?: () => void
) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const { mutateAsync } = useDeleteShippingRule(id)

  const handleDelete = async () => {
    const result = await prompt({
      title: t("general.areYouSure"),
      description: t("shippingRules.delete.confirmation", context),
      confirmText: t("shippingRules.actions.remove"),
      cancelText: t("actions.cancel"),
    })

    if (!result) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("shippingRules.delete.successToast"))
        onDeleted?.()
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  return handleDelete
}
