import { LoaderFunctionArgs } from "react-router-dom"
import { commissionRatesQueryKeys } from "../../../hooks/api/commission-rates"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { InferClientOutput } from "@mercurjs/client"

const commissionRateQuery = (id: string) => ({
  queryKey: commissionRatesQueryKeys.detail(id),
  queryFn: async () =>
    sdk.admin.commissionRates.$id.query({ $id: id }),
})

export const commissionRateLoader = async ({
  params,
}: LoaderFunctionArgs) => {
  const id = params.id
  const query = commissionRateQuery(id!)

  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  ) as InferClientOutput<typeof sdk.admin.commissionRates.$id.query>
}
