import { LoaderFunctionArgs } from "react-router-dom"

import { stockLocationsQueryKeys } from "../../../hooks/api/stock-locations"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { LOCATION_DETAILS_FIELD } from "./constants"

const locationQuery = (id: string) => ({
  queryKey: stockLocationsQueryKeys.detail(id, {
    fields: LOCATION_DETAILS_FIELD,
  }),
  queryFn: async () =>
    sdk.admin.stockLocation.retrieve(id, {
      fields: LOCATION_DETAILS_FIELD,
    }),
})

export const locationLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.location_id
  const query = locationQuery(id!)

  return queryClient.ensureQueryData(query)
}
