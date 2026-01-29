import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, ReactNode } from "react"

export interface ProductsPageContextValue {
  // Data
  products: HttpTypes.AdminProduct[]
  count: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  // Query
  searchParams: Record<string, any>
  rawQuery: Record<string, any>
  pageSize: number
}

const ProductsPageContext = createContext<ProductsPageContextValue | null>(null)

export function useProductsPageContext() {
  const context = useContext(ProductsPageContext)
  if (!context) {
    throw new Error("useProductsPageContext must be used within ProductsPage")
  }
  return context
}

export const ProductsPageProvider = ProductsPageContext.Provider
