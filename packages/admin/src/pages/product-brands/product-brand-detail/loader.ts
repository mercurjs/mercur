import { LoaderFunctionArgs } from "react-router-dom"

import { productBrandsQueryKeys } from "../../../hooks/api/product-brands"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const productBrandDetailQuery = (id: string) => ({
  queryKey: productBrandsQueryKeys.detail(id),
  queryFn: async () => sdk.admin.productBrands.$id.query({ $id: id }),
})

export const productBrandLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = productBrandDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
