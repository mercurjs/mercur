import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerReview from '../../../links/seller-review'
import { VendorReviewListResponse } from '../../../modules/reviews/types'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorReviewListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: reviews, metadata } = await query.graph({
    entity: sellerReview.entryPoint,
    fields: req.queryConfig.fields.map((field) => `review.${field}`),
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    reviews: reviews.map((relation) => relation.review),
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0
  })
}
