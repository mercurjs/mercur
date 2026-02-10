import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductOrganizationContextValue {
  product: HttpTypes.AdminProduct
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductOrganizationContext = createContext<ProductOrganizationContextValue | null>(null)

export function useProductOrganizationContext() {
  const context = useContext(ProductOrganizationContext)
  if (!context) {
    throw new Error("useProductOrganizationContext must be used within ProductOrganizationDrawer")
  }
  return context
}

export function ProductOrganizationProvider({ children, value }: { children: ReactNode; value: ProductOrganizationContextValue }) {
  return <ProductOrganizationContext.Provider value={value}>{children}</ProductOrganizationContext.Provider>
}
