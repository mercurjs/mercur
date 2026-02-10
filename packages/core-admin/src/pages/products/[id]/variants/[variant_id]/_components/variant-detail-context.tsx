import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface VariantDetailContextValue {
  variant: HttpTypes.AdminProductVariant
  isLoading: boolean
  isError: boolean
  error: Error | null
}

const VariantDetailContext = createContext<VariantDetailContextValue | null>(
  null
)

export function useVariantDetailContext() {
  const context = useContext(VariantDetailContext)
  if (!context) {
    throw new Error(
      "useVariantDetailContext must be used within VariantDetailPage"
    )
  }
  return context
}

export function VariantDetailProvider({
  children,
  value,
}: {
  children: ReactNode
  value: VariantDetailContextValue
}) {
  return (
    <VariantDetailContext.Provider value={value}>
      {children}
    </VariantDetailContext.Provider>
  )
}
