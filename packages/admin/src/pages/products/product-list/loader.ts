import { QueryClient } from "@tanstack/react-query"

import { productsQueryKeys } from "../../../hooks/api/products"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const productsListQuery = () => ({
  queryKey: productsQueryKeys.list({
    limit: 20,
    offset: 0,
  }),
  queryFn: async () =>
    sdk.admin.products.query({ limit: 20, offset: 0, fields: "id,title,handle,status,*collection,*categories,variants.id,thumbnail,*sellers" }),
})

export const productsLoader = (client: QueryClient) => {
  return async () => {
    const query = productsListQuery()

    return (
      queryClient.getQueryData(query.queryKey) ??
      (await client.fetchQuery(query))
    )
  }
}
