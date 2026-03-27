import { LoaderFunctionArgs } from "react-router-dom"

import { attributesQueryKeys } from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { InferClientInput } from "@mercurjs/client"

const attributeListQuery = (query?: InferClientInput<typeof sdk.admin.attributes.query>) => ({
  queryKey: attributesQueryKeys.list(query),
  queryFn: async () => sdk.admin.attributes.query({ ...query }),
})

export const attributeListLoader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams

  const queryObject: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    try {
      queryObject[key] = JSON.parse(value)
    } catch (_e) {
      queryObject[key] = value
    }
  })

  const query = attributeListQuery(
    queryObject as InferClientInput<typeof sdk.admin.attributes.query>
  )

  return (
    queryClient.getQueryData<any>(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
