// Route: /products
import { QueryClient } from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"
import { productsQueryKeys } from "@hooks/api/products"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"

import { ProductListPage } from "./product-list-page"
import { PAGE_SIZE } from "./_components/product-list-table"

// Loader for pre-fetching data
const productsListQuery = () => ({
  queryKey: productsQueryKeys.list({
    limit: PAGE_SIZE,
    offset: 0,
  }),
  queryFn: async () =>
    fetchQuery("/vendor/products", {
      method: "GET",
      query: {
        limit: PAGE_SIZE,
        offset: 0,
        fields: "+thumbnail,*categories,+status",
      },
    }),
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

// Main component
export const Component = () => {
  return <ProductListPage />
}
