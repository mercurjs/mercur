import { ReactNode } from "react"
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useProductVariant } from "@hooks/api/products"

import { VARIANT_DETAIL_FIELDS } from "../../_common/constants"
import { ManageVariantInventoryItemsForm } from "./manage-variant-inventory-items-form"
import {
  VariantManageItemsProvider,
  useVariantManageItemsContext,
  type VariantWithInventoryItems,
} from "./variant-manage-items-context"

function Content() {
  const { variant, isLoading } = useVariantManageItemsContext()

  if (isLoading || !variant) {
    return null
  }

  return <ManageVariantInventoryItemsForm variant={variant} />
}

export interface VariantManageItemsModalProps {
  children?: ReactNode
}

function Root({ children }: VariantManageItemsModalProps) {
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
    <VariantManageItemsProvider
      value={{
        variant: variant! as VariantWithInventoryItems,
        isLoading,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteFocusModal>
        {children ?? <Content />}
      </RouteFocusModal>
    </VariantManageItemsProvider>
  )
}

export const VariantManageItemsModal = Object.assign(Root, {
  Content,
  useContext: useVariantManageItemsContext,
})
