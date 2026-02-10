import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export type VariantWithInventoryItems = HttpTypes.AdminProductVariant & {
  inventory_items: {
    inventory: HttpTypes.AdminInventoryItem
    inventory_item_id: string
    required_quantity: number
  }[]
}

export interface VariantManageItemsContextValue {
  variant: VariantWithInventoryItems
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const VariantManageItemsContext =
  createContext<VariantManageItemsContextValue | null>(null)

export function useVariantManageItemsContext() {
  const context = useContext(VariantManageItemsContext)
  if (!context) {
    throw new Error(
      "useVariantManageItemsContext must be used within VariantManageItemsModal"
    )
  }
  return context
}

export function VariantManageItemsProvider({
  children,
  value,
}: {
  children: ReactNode
  value: VariantManageItemsContextValue
}) {
  return (
    <VariantManageItemsContext.Provider value={value}>
      {children}
    </VariantManageItemsContext.Provider>
  )
}
