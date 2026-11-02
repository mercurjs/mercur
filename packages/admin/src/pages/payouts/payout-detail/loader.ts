import { LoaderFunctionArgs } from "react-router-dom"

import { payoutsQueryKeys } from "../../../hooks/api/payouts"
import { AdminPayout } from "../../../lib/payouts"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const payoutDetailQuery = (id: string) => ({
  queryKey: payoutsQueryKeys.detail(id),
  queryFn: async () =>
    sdk.admin.payouts.$id.query({ $id: id }) as Promise<{ payout: AdminPayout }>,
})

export const payoutLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = payoutDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
