import { getLinkQuery } from "@mercurjs/dashboard-shared"
import { LoaderFunctionArgs } from "react-router-dom"

import { offerQueryKeys } from "../../../../../hooks/api/offers"
import { sdk } from "../../../../../lib/client"
import { queryClient } from "../../../../../lib/query-client"
import { OFFER_VARIANT_DETAIL_FIELDS } from "../../../common/constants"

/**
 * The Offer Variant detail is keyed by offer id (`:offer_id`) — a
 * variant may carry several of the seller's offers (SPEC-009), so the
 * offer is the unit. Loads that offer directly.
 */
const offerVariantDetailQuery = (offerId: string) => {
  const query = getLinkQuery("offer", OFFER_VARIANT_DETAIL_FIELDS)
  return {
    queryKey: offerQueryKeys.detail(offerId, query),
    queryFn: async () =>
      sdk.vendor.offers.$id.query({
        $id: offerId,
        ...query,
      }),
  }
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const offerId = params.offer_id
  return queryClient.ensureQueryData(offerVariantDetailQuery(offerId!))
}
