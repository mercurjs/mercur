import { LoaderFunctionArgs } from "react-router-dom"

import { offerQueryKeys } from "../../../../../hooks/api/offers"
import { sdk } from "../../../../../lib/client"
import { queryClient } from "../../../../../lib/query-client"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../common/constants"

/**
 * The admin Offer Variant detail is keyed by offer id (`:offer_id`) — a
 * variant may carry several offers (SPEC-010), so the offer is the unit.
 * Loaded directly from `/admin/offers/:id` (read-only).
 */
const offerVariantDetailQuery = (offerId: string) => ({
  queryKey: offerQueryKeys.detail(offerId, {
    fields: OFFER_VARIANT_DETAIL_FIELDS,
  }),
  queryFn: async () =>
    sdk.admin.offers.$id.query({
      $id: offerId,
      fields: OFFER_VARIANT_DETAIL_FIELDS,
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const offerId = params.offer_id
  return queryClient.ensureQueryData(offerVariantDetailQuery(offerId!))
}
