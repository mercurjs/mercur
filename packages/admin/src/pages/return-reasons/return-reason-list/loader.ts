import { returnReasonsQueryKeys } from "../../../hooks/api/return-reasons"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { InferClientInput } from "@mercurjs/client"

const returnReasonListQuery = (query?: InferClientInput<typeof sdk.admin.returnReasons.query>) => ({
  queryKey: returnReasonsQueryKeys.list(query),
  queryFn: async () => sdk.admin.returnReasons.query({ ...query }),
})

export const returnReasonListLoader = async () => {
  const query = returnReasonListQuery()
  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
