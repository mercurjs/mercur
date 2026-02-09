import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductMediaContextValue {
  product: HttpTypes.AdminProduct
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const ProductMediaContext = createContext<ProductMediaContextValue | null>(null)

export function useProductMediaContext() {
  const context = useContext(ProductMediaContext)
  if (!context) {
    throw new Error(
      "useProductMediaContext must be used within ProductMediaModal"
    )
  }
  return context
}

export function ProductMediaProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ProductMediaContextValue
}) {
  return (
    <ProductMediaContext.Provider value={value}>
      {children}
    </ProductMediaContext.Provider>
  )
}
