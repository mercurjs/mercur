import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductStockContextValue {
  data: Promise<{
    variants: HttpTypes.AdminProductVariant[]
    locations: HttpTypes.AdminStockLocation[]
  }>
}

const ProductStockContext = createContext<ProductStockContextValue | null>(null)

export function useProductStockContext() {
  const context = useContext(ProductStockContext)
  if (!context) {
    throw new Error(
      "useProductStockContext must be used within ProductStockModal"
    )
  }
  return context
}

export function ProductStockProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ProductStockContextValue
}) {
  return (
    <ProductStockContext.Provider value={value}>
      {children}
    </ProductStockContext.Provider>
  )
}
