import { Heading } from "@medusajs/ui"
import { useLinkQuery } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { usePromotion } from "../../../hooks/api/promotions"
import { PROMOTION_DETAIL_BASE_FIELDS } from "../promotion-detail/loader"
import { EditPromotionDetailsForm } from "./components/edit-promotion-form"

export const PromotionEditDetails = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const linkQuery = useLinkQuery("promotion", PROMOTION_DETAIL_BASE_FIELDS)
  const { promotion, isLoading, isError, error } = usePromotion(id!, linkQuery)

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("promotions.edit.title")}</Heading>
      </RouteDrawer.Header>

      {!isLoading && promotion && (
        <EditPromotionDetailsForm promotion={promotion} />
      )}
    </RouteDrawer>
  )
}
