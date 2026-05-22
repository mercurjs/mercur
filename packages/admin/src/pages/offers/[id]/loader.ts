import { LoaderFunctionArgs } from "react-router-dom"

import { offerQueryKeys } from "../../../hooks/api/offers"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { OFFER_DETAIL_FIELDS } from "../common/constants"

const offerDetailQuery = (id: string) => ({
  queryKey: offerQueryKeys.detail(id, { fields: OFFER_DETAIL_FIELDS }),
  queryFn: async () =>
    sdk.admin.offers.$id.query({ $id: id, fields: OFFER_DETAIL_FIELDS }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = offerDetailQuery(id!)
  return queryClient.ensureQueryData(query)
}
