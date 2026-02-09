import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductAttributesContextValue {
  product: HttpTypes.AdminProduct
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductAttributesContext = createContext<ProductAttributesContextValue | null>(null)

export function useProductAttributesContext() {
  const context = useContext(ProductAttributesContext)
  if (!context) {
    throw new Error("useProductAttributesContext must be used within ProductAttributesDrawer")
  }
  return context
}

export function ProductAttributesProvider({ children, value }: { children: ReactNode; value: ProductAttributesContextValue }) {
  return <ProductAttributesContext.Provider value={value}>{children}</ProductAttributesContext.Provider>
}
