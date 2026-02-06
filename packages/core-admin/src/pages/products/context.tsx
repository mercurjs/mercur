import { createContext, useContext, useState, ReactNode } from 'react'
import type { Product, ProductsPageContextValue } from './types'

const ProductsPageContext = createContext<ProductsPageContextValue | null>(null)

export function useProductsPageContext(): ProductsPageContextValue {
  const context = useContext(ProductsPageContext)
  if (!context) {
    throw new Error('useProductsPageContext must be used within ProductsPage')
  }
  return context
}

export function ProductsPageProvider({
  children,
  initialProducts = [],
}: {
  children: ReactNode
  initialProducts?: Product[]
}) {
  const [search, setSearch] = useState('')

  // In POC we use provided data, later this will use useProducts hook
  const products = initialProducts
  const isLoading = false
  const error = null

  return (
    <ProductsPageContext.Provider
      value={{
        products,
        isLoading,
        error,
        search,
        setSearch,
      }}
    >
      {children}
    </ProductsPageContext.Provider>
  )
}
