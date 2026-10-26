import { LoaderFunctionArgs } from "react-router-dom"

import { payoutCapturesQueryKeys } from "../../../hooks/api/payout-captures"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const payoutCaptureDetailQuery = (orderGroupId: string) => ({
  queryKey: payoutCapturesQueryKeys.detail(orderGroupId),
  queryFn: async () =>
    sdk.admin.payoutCaptures.$orderGroupId.query({ $orderGroupId: orderGroupId }),
})

export const payoutCaptureLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = payoutCaptureDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
