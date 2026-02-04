// Route: /products
import { QueryClient } from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"
import { productsQueryKeys } from "@hooks/api/products"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

import { ProductsPage } from "./_components"

export const nav = {
  id: "products",
  labelKey: "navigation.items.products",
  iconKey: "tag",
  section: "catalog",
  order: 20,
}

// Re-export compound component and types for user overrides
export { ProductsPage }
export type { ProductsPageProps } from "./_components/products-page"
export type { ProductsPageContextValue } from "./_components/products-context"

// Loader for pre-fetching data
const productsListQuery = () => ({
  queryKey: productsQueryKeys.list({
    limit: 20,
    offset: 0,
    is_giftcard: false,
  }),
  queryFn: async () =>
    sdk.admin.product.list({ limit: 20, offset: 0, is_giftcard: false }),
})

export const loader = (client: QueryClient) => {
  return async () => {
    const query = productsListQuery()

    return (
      queryClient.getQueryData<HttpTypes.AdminProductListResponse>(
        query.queryKey
      ) ?? (await client.fetchQuery(query))
    )
  }
}

// Main component - uses compound component with default layout
// Users can override this file to customize the layout
export const Component = () => {
  return (
    <ProductsPage>
      <ProductsPage.Header>
        <ProductsPage.Actions />
      </ProductsPage.Header>
      <ProductsPage.Table />
    </ProductsPage>
  )
}
