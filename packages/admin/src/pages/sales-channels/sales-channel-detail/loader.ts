import { LoaderFunctionArgs } from "react-router-dom"

import { productsQueryKeys } from "../../../hooks/api/products"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const salesChannelDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id),
  queryFn: async () => sdk.admin.salesChannel.retrieve(id),
})

export const salesChannelLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = salesChannelDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
