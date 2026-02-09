import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductShippingProfileContextValue {
  product: HttpTypes.AdminProduct & {
    shipping_profile?: HttpTypes.AdminShippingProfile
  }
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductShippingProfileContext = createContext<ProductShippingProfileContextValue | null>(null)

export function useProductShippingProfileContext() {
  const context = useContext(ProductShippingProfileContext)
  if (!context) {
    throw new Error("useProductShippingProfileContext must be used within ProductShippingProfileDrawer")
  }
  return context
}

export function ProductShippingProfileProvider({ children, value }: { children: ReactNode; value: ProductShippingProfileContextValue }) {
  return <ProductShippingProfileContext.Provider value={value}>{children}</ProductShippingProfileContext.Provider>
}
