import { LoaderFunctionArgs } from "react-router-dom"

import { membersQueryKeys } from "@hooks/api/members"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

const meQuery = () => ({
  queryKey: membersQueryKeys.me(),
  queryFn: async () => sdk.vendor.members.me.query(),
})

export const storeDetailLoader = async (_: LoaderFunctionArgs) => {
  return queryClient.ensureQueryData({
    ...meQuery(),
    staleTime: 90000,
  })
}
