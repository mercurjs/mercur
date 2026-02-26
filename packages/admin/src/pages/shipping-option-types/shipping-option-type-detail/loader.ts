import { LoaderFunctionArgs } from "react-router-dom"

import { shippingOptionTypesQueryKeys } from "../../../hooks/api/shipping-option-types"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const shippingOptionTypeDetailQuery = (id: string) => ({
  queryKey: shippingOptionTypesQueryKeys.detail(id),
  queryFn: async () => sdk.admin.shippingOptionTypes.$id.query({ $id: id }),
})

export const shippingOptionTypeLoader = async ({
  params,
}: LoaderFunctionArgs) => {
  const id = params.id
  const query = shippingOptionTypeDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
