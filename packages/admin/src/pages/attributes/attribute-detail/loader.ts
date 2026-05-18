import { LoaderFunctionArgs } from "react-router-dom"

import { productAttributesQueryKeys } from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const attributeDetailQuery = (id: string) => ({
  queryKey: productAttributesQueryKeys.detail(id),
  queryFn: async () =>
    sdk.admin.productAttributes.$id.query({ $id: id }),
})

export const attributeDetailLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = attributeDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
