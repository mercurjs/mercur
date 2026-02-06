import { LoaderFunctionArgs } from "react-router-dom"

import { productsQueryKeys } from "../../../hooks/api/products"
import { client } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const productDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id),
  queryFn: async () => client.admin.products.$id.query({ id }),
})

export const productLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = productDetailQuery(id!)

  const response = await queryClient.ensureQueryData({
    ...query,
    staleTime: 90000,
  })

  return response
}
