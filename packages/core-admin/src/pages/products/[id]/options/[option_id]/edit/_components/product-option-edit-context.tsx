import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductOptionEditContextValue {
  option: HttpTypes.AdminProductOption
  product: HttpTypes.AdminProduct
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductOptionEditContext = createContext<ProductOptionEditContextValue | null>(null)

export function useProductOptionEditContext() {
  const context = useContext(ProductOptionEditContext)
  if (!context) {
    throw new Error("useProductOptionEditContext must be used within ProductOptionEditDrawer")
  }
  return context
}

export function ProductOptionEditProvider({ children, value }: { children: ReactNode; value: ProductOptionEditContextValue }) {
  return <ProductOptionEditContext.Provider value={value}>{children}</ProductOptionEditContext.Provider>
}
