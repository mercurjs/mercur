import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductEditContextValue {
  product: HttpTypes.AdminProduct
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductEditContext = createContext<ProductEditContextValue | null>(null)

export function useProductEditContext() {
  const context = useContext(ProductEditContext)
  if (!context) {
    throw new Error("useProductEditContext must be used within ProductEditDrawer")
  }
  return context
}

export function ProductEditProvider({ children, value }: { children: ReactNode; value: ProductEditContextValue }) {
  return <ProductEditContext.Provider value={value}>{children}</ProductEditContext.Provider>
}
