import { InferClientOutput } from "@mercurjs/client"
import { retrieveActiveStore, storeQueryKeys } from "../../../hooks/api/store"
import { queryClient } from "../../../lib/query-client"
import { sdk } from "@/lib/client"

const storeDetailQuery = () => ({
  queryKey: storeQueryKeys.details(),
  queryFn: async () => retrieveActiveStore(),
})

export const storeLoader = async () => {
  const query = storeDetailQuery()

  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  ) as InferClientOutput<typeof sdk.admin.stores.$id.query>
}
