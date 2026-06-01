import { LoaderFunctionArgs } from "react-router-dom"

import { sellersQueryKeys } from "../../../hooks/api/sellers"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const sellerDetailQuery = (id: string) => ({
  queryKey: sellersQueryKeys.detail(id),
  queryFn: async () => sdk.admin.sellers.$id.query({ $id: id }),
})

export const storeDetailLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id!

  return queryClient.ensureQueryData({
    ...sellerDetailQuery(id),
    staleTime: 90000,
  })
}
