// Route: /products/:id/media
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { ProductMediaView } from "./product-media-view"

export const Component = () => {
  const { t } = useTranslation()
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!)

  const ready = !isLoading && product

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.media.label")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.media.editHint")}</span>
      </RouteFocusModal.Description>
      {ready && <ProductMediaView product={product} />}
    </RouteFocusModal>
  )
}
