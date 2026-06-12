// Route: /products/:product_id/variants/:variant_id/media
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useProductVariant } from "@hooks/api/products"

import { VARIANT_DETAIL_FIELDS } from "../loader"
import { EditVariantMediaForm } from "./edit-variant-media-form"

export const Component = () => {
  const { t } = useTranslation()
  const { product_id, variant_id } = useParams()

  const { variant, isLoading, isError, error } = useProductVariant(
    product_id!,
    variant_id!,
    { fields: VARIANT_DETAIL_FIELDS }
  )

  if (isError) {
    throw error
  }

  const ready = !isLoading && !!variant

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.media.label")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.media.editHint")}</span>
      </RouteFocusModal.Description>
      {ready && <EditVariantMediaForm variant={variant} />}
    </RouteFocusModal>
  )
}
