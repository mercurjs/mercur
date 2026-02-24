import { LoaderFunctionArgs } from "react-router-dom"
import { promotionsQueryKeys } from "../../../../../../POC PRojects/core-admin/src/hooks/api/promotions"
import { sdk } from "../../../../../../POC PRojects/core-admin/src/lib/client"
import { queryClient } from "../../../../../../POC PRojects/core-admin/src/lib/query-client"

const promotionDetailQuery = (id: string) => ({
  queryKey: promotionsQueryKeys.detail(id),
  queryFn: async () => sdk.admin.promotion.retrieve(id),
})

export const promotionLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = promotionDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
