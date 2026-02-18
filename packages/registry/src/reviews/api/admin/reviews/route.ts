import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { AdminReviewListResponse } from '../../../modules/reviews/types'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse<AdminReviewListResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: reviews, metadata } = await query.graph({
    entity: 'review',
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    reviews,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0
  })
}
