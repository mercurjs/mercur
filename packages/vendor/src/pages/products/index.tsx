// Route: /products
import { QueryClient } from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"
import { productsQueryKeys } from "@hooks/api/products"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { ProductListTable, PAGE_SIZE } from "./_components/product-list-table"

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
  const { getWidgets } = useDashboardExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("product.list.after"),
        before: getWidgets("product.list.before"),
      }}
    >
      <ProductListTable />
    </SingleColumnPage>
  )
}
