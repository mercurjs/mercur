import { useNavigate } from "react-router-dom"
import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { useDeleteProductBrand } from "../../../../hooks/api/product-brands"

export const useDeleteProductBrandAction = (id: string, name: string) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  const { mutateAsync } = useDeleteProductBrand(id)

  const handleDelete = async () => {
    const result = await prompt({
      title: t("general.areYouSure"),
      description: t("productBrands.delete.confirmation", { name }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!result) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        navigate("/settings/product-brands", { replace: true })
        toast.success(t("productBrands.delete.successToast", { name }))
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  return handleDelete
}
