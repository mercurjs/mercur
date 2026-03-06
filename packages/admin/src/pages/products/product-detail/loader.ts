import { LoaderFunctionArgs } from "react-router-dom"

import { productsQueryKeys } from "../../../hooks/api/products"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { AdminProductResponse } from "@mercurjs/types"
import { PRODUCT_DETAIL_QUERY } from "../constants"

const productDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id, PRODUCT_DETAIL_QUERY),
  queryFn: async () =>
    sdk.admin.products.$id.query({ $id: id, ...PRODUCT_DETAIL_QUERY }),
})

export const productLoader = async ({ params }: LoaderFunctionArgs): Promise<AdminProductResponse> => {
  const id = params.id
  const query = productDetailQuery(id!)

  const response = await queryClient.ensureQueryData({
    ...query,
    staleTime: 90000,
  })

  return response
}
