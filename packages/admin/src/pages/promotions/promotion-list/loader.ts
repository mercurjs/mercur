import { QueryClient } from "@tanstack/react-query"
import { promotionsQueryKeys } from "../../../hooks/api/promotions"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const params = {
  limit: 20,
  offset: 0,
}

const promotionsListQuery = () => ({
  queryKey: promotionsQueryKeys.list(params),
  queryFn: async () => sdk.admin.promotions.query(params),
})

export const promotionsLoader = (client: QueryClient) => {
  return async () => {
    const query = promotionsListQuery()

    return (
      queryClient.getQueryData(query.queryKey) ??
      (await client.fetchQuery(query))
    )
  }
}
