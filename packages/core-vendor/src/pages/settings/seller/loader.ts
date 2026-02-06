import { HttpTypes } from "@medusajs/types"

import { retrieveActiveStore, storeQueryKeys } from "@hooks/api/store"
import { queryClient } from "@lib/query-client"

const sellerDetailQuery = () => ({
  queryKey: storeQueryKeys.details(),
  queryFn: async () => retrieveActiveStore(),
})

export const sellerLoader = async () => {
  const query = sellerDetailQuery()

  return (
    queryClient.getQueryData<HttpTypes.AdminStoreResponse>(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
