import { HttpTypes } from "@medusajs/types"
import { QueryClient } from "@tanstack/react-query"
import { promotionsQueryKeys } from "../../../../../../POC PRojects/core-admin/src/hooks/api/promotions"
import { sdk } from "../../../../../../POC PRojects/core-admin/src/lib/client"
import { queryClient } from "../../../../../../POC PRojects/core-admin/src/lib/query-client"

const params = {
  limit: 20,
  offset: 0,
}

const promotionsListQuery = () => ({
  queryKey: promotionsQueryKeys.list(params),
  queryFn: async () => sdk.admin.promotion.list(params),
})

export const promotionsLoader = (client: QueryClient) => {
  return async () => {
    const query = promotionsListQuery()

    return (
      queryClient.getQueryData<HttpTypes.AdminPromotionListResponse>(
        query.queryKey
      ) ?? (await client.fetchQuery(query))
    )
  }
}
