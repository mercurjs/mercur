import { QueryClient } from "@tanstack/react-query"
import { getLinkQuery } from "@mercurjs/dashboard-shared"

import { productsQueryKeys } from "../../../hooks/api/products"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const LIST_FIELDS =
  "id,title,handle,status,*collection,*categories,variants.id,thumbnail"

const productsListQuery = () => {
  const { fields } = getLinkQuery("product", LIST_FIELDS)
  return {
    queryKey: productsQueryKeys.list({ limit: 20, offset: 0, fields }),
    queryFn: async () =>
      sdk.admin.products.query({ limit: 20, offset: 0, fields }),
  }
}

export const productsLoader = (client: QueryClient) => {
  return async () => {
    const query = productsListQuery()

    return (
      queryClient.getQueryData(query.queryKey) ??
      (await client.fetchQuery(query))
    )
  }
}
