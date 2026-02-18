import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
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
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
