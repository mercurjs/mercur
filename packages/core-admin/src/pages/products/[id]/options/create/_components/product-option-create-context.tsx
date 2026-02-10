import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductOptionCreateContextValue {
  product: HttpTypes.AdminProduct
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductOptionCreateContext = createContext<ProductOptionCreateContextValue | null>(null)

export function useProductOptionCreateContext() {
  const context = useContext(ProductOptionCreateContext)
  if (!context) {
    throw new Error("useProductOptionCreateContext must be used within ProductOptionCreateDrawer")
  }
  return context
}

export function ProductOptionCreateProvider({ children, value }: { children: ReactNode; value: ProductOptionCreateContextValue }) {
  return <ProductOptionCreateContext.Provider value={value}>{children}</ProductOptionCreateContext.Provider>
}
