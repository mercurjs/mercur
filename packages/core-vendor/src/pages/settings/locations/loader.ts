import { LoaderFunctionArgs } from "react-router-dom"

import { HttpTypes } from "@medusajs/types"
import { stockLocationsQueryKeys } from "@hooks/api/stock-locations"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { LOCATION_LIST_FIELDS } from "./constants"

const shippingListQuery = () => ({
  queryKey: stockLocationsQueryKeys.lists(),
  queryFn: async () => {
    return await fetchQuery("/vendor/stock-locations", {
      method: "GET",
      query: { fields: LOCATION_LIST_FIELDS },
    })
  },
})

export const shippingListLoader = async (_: LoaderFunctionArgs) => {
  const query = shippingListQuery()

  return (
    queryClient.getQueryData<HttpTypes.AdminStockLocationListResponse>(
      query.queryKey
    ) ?? (await queryClient.fetchQuery(query))
  )
}
