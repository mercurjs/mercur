import { LoaderFunctionArgs } from "react-router-dom"

import { productTagsQueryKeys } from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { InferClientInput } from "@mercurjs/client"

const productTagListQuery = (query?: InferClientInput<typeof sdk.admin.productTags.query>) => ({
  queryKey: productTagsQueryKeys.list(query),
  queryFn: async () => sdk.admin.productTags.query({ ...query }),
})

export const productTagListLoader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams

  const queryObject: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    try {
      queryObject[key] = JSON.parse(value)
    } catch (_e) {
      queryObject[key] = value
    }
  })

  const query = productTagListQuery(
    queryObject
  )

  return (
    queryClient.getQueryData<any>(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
