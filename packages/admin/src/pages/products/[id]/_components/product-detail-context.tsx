import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductDetailContextValue {
  product: HttpTypes.AdminProduct
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductDetailContext = createContext<ProductDetailContextValue | null>(null)

export function useProductDetailContext() {
  const context = useContext(ProductDetailContext)
  if (!context) {
    throw new Error("useProductDetailContext must be used within ProductDetailPage")
  }
  return context
}

export function ProductDetailProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ProductDetailContextValue
}) {
  return (
    <ProductDetailContext.Provider value={value}>
      {children}
    </ProductDetailContext.Provider>
  )
}
