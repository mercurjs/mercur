import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductSalesChannelsContextValue {
  product: HttpTypes.AdminProduct
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductSalesChannelsContext =
  createContext<ProductSalesChannelsContextValue | null>(null)

export function useProductSalesChannelsContext() {
  const context = useContext(ProductSalesChannelsContext)
  if (!context) {
    throw new Error(
      "useProductSalesChannelsContext must be used within ProductSalesChannelsModal"
    )
  }
  return context
}

export function ProductSalesChannelsProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ProductSalesChannelsContextValue
}) {
  return (
    <ProductSalesChannelsContext.Provider value={value}>
      {children}
    </ProductSalesChannelsContext.Provider>
  )
}
