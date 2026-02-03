import { shippingOptionTypesQueryKeys } from "@hooks/api/shipping-option-types"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

import type { LoaderFunctionArgs } from "react-router-dom"

const shippingOptionTypeDetailQuery = (id: string) => ({
  queryKey: shippingOptionTypesQueryKeys.detail(id),
  queryFn: async () => sdk.admin.shippingOptionType.retrieve(id),
})

export const shippingOptionTypeLoader = async ({
  params,
}: LoaderFunctionArgs) => {
  const id = params.id
  const query = shippingOptionTypeDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
