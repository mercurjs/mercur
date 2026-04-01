import { LoaderFunctionArgs } from "react-router-dom"

import { sellersQueryKeys } from "../../../hooks/api/sellers"
import { subscriptionPlansQueryKeys } from "../../../hooks/api/subscription-plans"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const sellerDetailQuery = (id: string) => ({
  queryKey: sellersQueryKeys.detail(id),
  queryFn: async () => sdk.admin.sellers.$id.query({ $id: id }),
})

const subscriptionPlansQuery = (currencyCode: string) => ({
  queryKey: subscriptionPlansQueryKeys.list({ currency_code: currencyCode, offset: 0, limit: 100 }),
  queryFn: async () =>
    sdk.admin.subscriptionPlans.query({ currency_code: currencyCode, offset: 0, limit: 100 }),
})

export const storeDetailLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id!

  const sellerData = await queryClient.ensureQueryData({
    ...sellerDetailQuery(id),
    staleTime: 90000,
  })

  const currencyCode = sellerData.seller?.currency_code

  if (currencyCode) {
    queryClient.ensureQueryData({
      ...subscriptionPlansQuery(currencyCode),
      staleTime: 90000,
    })
  }

  return sellerData
}
