import { getLinkQuery } from "@mercurjs/dashboard-shared"
import { LoaderFunctionArgs } from "react-router-dom"
import { priceListsQueryKeys } from "../../../hooks/api/price-lists"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const pricingDetailQuery = (id: string) => {
  const query = getLinkQuery("price_list", "+prices.id")

  return {
    queryKey: priceListsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.priceLists.$id.query({ $id: id, ...query }),
  }
}

export const pricingLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = pricingDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
