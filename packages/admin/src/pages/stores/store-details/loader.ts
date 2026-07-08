import { getLinkQuery } from "@mercurjs/dashboard-shared"
import { LoaderFunctionArgs } from "react-router-dom"

import { sellersQueryKeys } from "../../../hooks/api/sellers"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

export const STORE_DETAIL_FIELDS =
  "+address.*,+payment_details.*,+professional_details.*"

const sellerDetailQuery = (id: string) => {
  const query = getLinkQuery("seller", STORE_DETAIL_FIELDS)

  return {
    queryKey: sellersQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.sellers.$id.query({ $id: id, ...query }),
  }
}

export const storeDetailLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id!

  return queryClient.ensureQueryData({
    ...sellerDetailQuery(id),
    staleTime: 90000,
  })
}
