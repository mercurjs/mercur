import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductPricesContextValue {
  product: HttpTypes.AdminProduct
  variantId: string | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductPricesContext = createContext<ProductPricesContextValue | null>(
  null
)

export function useProductPricesContext() {
  const context = useContext(ProductPricesContext)
  if (!context) {
    throw new Error(
      "useProductPricesContext must be used within ProductPricesModal"
    )
  }
  return context
}

export function ProductPricesProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ProductPricesContextValue
}) {
  return (
    <ProductPricesContext.Provider value={value}>
      {children}
    </ProductPricesContext.Provider>
  )
}
