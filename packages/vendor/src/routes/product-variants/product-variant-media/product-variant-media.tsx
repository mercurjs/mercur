import { useParams } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"

import { RouteFocusModal } from "../../../components/modals"
import { useProductVariant } from "../../../hooks/api/products"
import { EditProductVariantMediaForm } from "./components/edit-product-variant-media-form"

type ProductMediaVariantsReponse = HttpTypes.AdminProductVariant & {
  images: HttpTypes.AdminProductImage[]
}

export const ProductVariantMedia = () => {
  const { id, variant_id } = useParams()

  const { variant, isFetching, isError, error } = useProductVariant(
    id!,
    variant_id!,
    {
      fields: "*product,*product.images,*images,+images.variants.id",
    }
  )

  const ready = !isFetching && variant

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {ready && (
        <EditProductVariantMediaForm
          variant={variant as ProductMediaVariantsReponse}
        />
      )}
    </RouteFocusModal>
  )
}
