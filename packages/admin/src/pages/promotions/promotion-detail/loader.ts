import { getLinkQuery } from "@mercurjs/dashboard-shared"
import { LoaderFunctionArgs } from "react-router-dom"
import { promotionsQueryKeys } from "../../../hooks/api/promotions"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

export const PROMOTION_DETAIL_BASE_FIELDS =
  "+type,+seller.id,+seller.name,+promotion_cost.cost_bearer,+promotion_cost.shared_marketplace_percentage"

const promotionDetailQuery = (id: string) => {
  const query = getLinkQuery("promotion", PROMOTION_DETAIL_BASE_FIELDS)
  return {
    queryKey: promotionsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.promotions.$id.query({ $id: id, ...query }),
  }
}

export const promotionLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = promotionDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
