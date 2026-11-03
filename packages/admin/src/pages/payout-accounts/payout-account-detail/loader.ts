import { LoaderFunctionArgs } from "react-router-dom"

import { payoutAccountsQueryKeys } from "../../../hooks/api/payout-accounts"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const payoutAccountDetailQuery = (id: string) => ({
  queryKey: payoutAccountsQueryKeys.detail(id),
  queryFn: async () =>
    sdk.admin.payoutAccounts.$id.query({ $id: id, fields: "+onboarding.data" }),
})

export const payoutAccountLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = payoutAccountDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
