import { offerConditionsQueryKeys } from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const offerConditionListQuery = () => ({
  queryKey: offerConditionsQueryKeys.list(),
  queryFn: async () => sdk.admin.offerConditions.query({}),
})

export const offerConditionListLoader = async () => {
  const query = offerConditionListQuery()
  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
