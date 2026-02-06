import { ReactNode, Children } from 'react'
import { ProductsPageProvider, useProductsPageContext } from './context'
import { ProductsHeader } from './components/header'
import { ProductsTable } from './components/table'
import { ProductsActions } from './components/actions'
import type { ProductsPageProps, ProductsPageComponent } from './types'

function ProductsPageRoot({ children }: ProductsPageProps): ReactNode {
  // Mock data for POC
  const mockProducts = [
    { id: '1', title: 'Product 1', handle: 'product-1', status: 'published' },
    { id: '2', title: 'Product 2', handle: 'product-2', status: 'draft' },
    { id: '3', title: 'Product 3', handle: 'product-3', status: 'published' },
  ]

  const hasCustomChildren = Children.count(children) > 0

  return (
    <ProductsPageProvider initialProducts={mockProducts}>
      <div data-testid="products-page" className="flex flex-col gap-y-4">
        {hasCustomChildren ? (
          children
        ) : (
          // Default layout when no children provided
          <>
            <ProductsPage.Header>
              <ProductsPage.Actions />
            </ProductsPage.Header>
            <ProductsPage.Table />
          </>
        )}
      </div>
    </ProductsPageProvider>
  )
}

/**
 * ProductsPage - Compound component for displaying products list
 *
 * @example
 * // Level 1: Zero code - use defaults
 * <ProductsPage />
 *
 * @example
 * // Level 2: Composition - customize parts
 * <ProductsPage>
 *   <ProductsPage.Header title="My Products">
 *     <MyCustomFilter />
 *     <ProductsPage.Actions />
 *   </ProductsPage.Header>
 *   <ProductsPage.Table columns={myColumns} />
 * </ProductsPage>
 */
export const ProductsPage: ProductsPageComponent = Object.assign(ProductsPageRoot, {
  Header: ProductsHeader,
  Table: ProductsTable,
  Actions: ProductsActions,
  useContext: useProductsPageContext,
})
