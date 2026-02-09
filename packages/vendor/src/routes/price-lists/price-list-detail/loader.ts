import { LoaderFunctionArgs } from "react-router-dom"
import { priceListsQueryKeys } from "../../../hooks/api/price-lists"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const pricingDetailQuery = (id: string) => ({
  queryKey: priceListsQueryKeys.detail(id),
  queryFn: async () => sdk.admin.priceList.retrieve(id),
})

export const pricingLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = pricingDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
