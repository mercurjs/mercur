import { LoaderFunctionArgs } from "react-router-dom"

import { attributesQueryKeys } from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const attributeListQuery = () => ({
  queryKey: attributesQueryKeys.lists(),
  queryFn: async () =>
    sdk.admin.attributes.query({
      limit: 20,
      offset: 0,
      fields: "*possible_values,*product_categories",
    }),
})

export const attributeListLoader = async (_args: LoaderFunctionArgs) => {
  const query = attributeListQuery()

  return (
    queryClient.getQueryData<any>(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
