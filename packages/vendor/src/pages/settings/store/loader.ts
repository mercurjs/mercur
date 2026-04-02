import { LoaderFunctionArgs } from "react-router-dom"

import { membersQueryKeys } from "@hooks/api/members"
import { subscriptionQueryKeys } from "@hooks/api/subscription"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

const meQuery = () => ({
  queryKey: membersQueryKeys.me(),
  queryFn: async () => sdk.vendor.members.me.query(),
})

const subscriptionQuery = () => ({
  queryKey: subscriptionQueryKeys.details(),
  queryFn: async () => sdk.vendor.subscription.query(),
})

export const storeDetailLoader = async (_: LoaderFunctionArgs) => {
  const meData = await queryClient.ensureQueryData({
    ...meQuery(),
    staleTime: 90000,
  })

  queryClient.ensureQueryData({
    ...subscriptionQuery(),
    staleTime: 90000,
  })

  return meData
}
