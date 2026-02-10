import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface VariantEditContextValue {
  variant: HttpTypes.AdminProductVariant
  product: HttpTypes.AdminProduct
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const VariantEditContext = createContext<VariantEditContextValue | null>(null)

export function useVariantEditContext() {
  const context = useContext(VariantEditContext)
  if (!context) {
    throw new Error(
      "useVariantEditContext must be used within VariantEditDrawer"
    )
  }
  return context
}

export function VariantEditProvider({
  children,
  value,
}: {
  children: ReactNode
  value: VariantEditContextValue
}) {
  return (
    <VariantEditContext.Provider value={value}>
      {children}
    </VariantEditContext.Provider>
  )
}
