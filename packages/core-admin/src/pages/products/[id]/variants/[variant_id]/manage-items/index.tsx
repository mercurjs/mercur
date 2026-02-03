import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useProductVariant } from "@hooks/api/products"

import { VARIANT_DETAIL_FIELDS } from "../_common/constants"
import { ManageVariantInventoryItemsForm } from "./_components/manage-variant-inventory-items-form"

const ProductVariantManageInventoryItems = () => {
  const { id, variant_id } = useParams()

  const {
    variant,
    isPending: isLoading,
    isError,
    error,
  } = useProductVariant(id!, variant_id!, {
    fields: VARIANT_DETAIL_FIELDS,
  })

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {!isLoading && variant && (
        <ManageVariantInventoryItemsForm variant={variant} />
      )}
    </RouteFocusModal>
  )
}

export const Component = ProductVariantManageInventoryItems
