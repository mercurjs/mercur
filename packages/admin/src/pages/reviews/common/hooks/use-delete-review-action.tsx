import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { useDeleteReview } from "../../../../hooks/api/reviews"

export const useDeleteReviewAction = (id: string, navigateOnSuccess = false) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { mutateAsync } = useDeleteReview(id)

  const handleDelete = async () => {
    const confirm = await prompt({
      title: t("reviews.delete.confirmTitle"),
      description: t("reviews.delete.confirmDescription"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!confirm) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("reviews.delete.successToast"))
        if (navigateOnSuccess) {
          navigate("/reviews", { replace: true })
        }
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  return handleDelete
}
