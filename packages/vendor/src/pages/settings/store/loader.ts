import { LoaderFunctionArgs } from "react-router-dom"

import { meQueryOptions } from "@hooks/api/members"
import { queryClient } from "@lib/query-client"

export const storeDetailLoader = async (_: LoaderFunctionArgs) => {
  return queryClient.ensureQueryData({
    ...meQueryOptions(),
    staleTime: 90000,
  })
}
