import { LoaderFunctionArgs } from "react-router-dom"
import { getLinkQuery } from "@mercurjs/dashboard-shared"

import { productsQueryKeys } from "../../../hooks/api/products"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { AdminProductResponse } from "@mercurjs/types"
import { PRODUCT_DETAIL_QUERY } from "../constants"

export const productDetailQueryWithLinks = () =>
  getLinkQuery("product", PRODUCT_DETAIL_QUERY.fields)

const productDetailQuery = (id: string) => {
  const query = productDetailQueryWithLinks()
  return {
    queryKey: productsQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.admin.products.$id.query({ $id: id, ...query }),
  }
}

export const productLoader = async ({ params }: LoaderFunctionArgs): Promise<AdminProductResponse> => {
  const id = params.id
  const query = productDetailQuery(id!)

  const response = await queryClient.ensureQueryData({
    ...query,
    staleTime: 90000,
  })

  return response
}
