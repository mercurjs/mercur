import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteFocusModal } from "../../../components/modals"
import { useProduct } from "../../../hooks/api/products"
import { ProductMediaView } from "./components/product-media-view"

export const ProductMedia = () => {
  const { t } = useTranslation()
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!)

  const ready = !isLoading && product

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal data-testid="product-media-modal">
      <RouteFocusModal.Title asChild data-testid="product-media-modal-title">
        <span className="sr-only" data-testid="product-media-modal-title-text">{t("products.media.label")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild data-testid="product-media-modal-description">
        <span className="sr-only" data-testid="product-media-modal-description-text">{t("products.media.editHint")}</span>
      </RouteFocusModal.Description>
      {ready && <ProductMediaView product={product} />}
    </RouteFocusModal>
  )
}
