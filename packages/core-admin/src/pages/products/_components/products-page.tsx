import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { ReactNode, Children } from "react"
import { Outlet, useLoaderData } from "react-router-dom"

import { useProducts } from "@hooks/api/products"
import { useProductTableQuery } from "@hooks/table/query/use-product-table-query"

import {
  ProductsPageContextValue,
  ProductsPageProvider,
  useProductsPageContext,
} from "./products-context"
import { ProductsHeader } from "./products-header"
import { ProductsActions, useProductsActions } from "./products-actions"
import { ProductsTable } from "./products-table"

const PAGE_SIZE = 20

export interface ProductsPageProps {
  /** Custom page size */
  pageSize?: number
  /** Children - use ProductsPage.Header, ProductsPage.Table, etc. */
  children?: ReactNode
}

function ProductsPageRoot({ children, pageSize = PAGE_SIZE }: ProductsPageProps) {
  // Get initial data from loader (if available)
  const initialData = useLoaderData() as any

  // Query params
  const { searchParams, raw } = useProductTableQuery({ pageSize })

  // Fetch products
  const { products, count, isLoading, isError, error } = useProducts(
    {
      ...searchParams,
      is_giftcard: false,
    },
    {
      initialData,
      placeholderData: keepPreviousData,
    }
  )

  // Build context value
  const contextValue: ProductsPageContextValue = {
    products: products ?? [],
    count: count ?? 0,
    isLoading,
    isError,
    error: error as Error | null,
    searchParams,
    rawQuery: raw,
    pageSize,
  }

  // Throw error for error boundary
  if (isError) {
    throw error
  }

  const hasCustomChildren = Children.count(children) > 0

  return (
    <ProductsPageProvider value={contextValue}>
      <div data-testid="products-page">
        <Container className="divide-y p-0" data-testid="products-list-table">
          {hasCustomChildren ? (
            // User provided custom layout
            children
          ) : (
            // Default layout
            <>
              <ProductsPage.Header>
                <ProductsPage.Actions />
              </ProductsPage.Header>
              <ProductsPage.Table />
            </>
          )}
          <Outlet />
        </Container>
      </div>
    </ProductsPageProvider>
  )
}

// Compound component export
export const ProductsPage = Object.assign(ProductsPageRoot, {
  Header: ProductsHeader,
  Actions: ProductsActions,
  Table: ProductsTable,
  useContext: useProductsPageContext,
  useActions: useProductsActions,
})
