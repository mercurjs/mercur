import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerReview from '../../../links/seller-review'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
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
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
