import { getLinkQuery } from "@mercurjs/dashboard-shared"
import { LoaderFunctionArgs } from "react-router-dom"
import { promotionsQueryKeys } from "../../../hooks/api/promotions"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const promotionDetailQuery = (id: string) => {
  const query = getLinkQuery("promotion")
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
