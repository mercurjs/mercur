import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { filterSellerProductsByCollection } from '../../utils'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { productIds, count } = await filterSellerProductsByCollection(
    req.scope,
    req.params.id,
    req.filterableFields.seller_id as string,
    req.queryConfig.pagination?.skip || 0,
    req.queryConfig.pagination?.take || 10
  )

  const { data: products } = await query.graph({
    entity: 'product',
    fields: req.queryConfig.fields,
    filters: {
      id: productIds
    }
  })

  res.json({
    products,
    count,
    offset: req.queryConfig.pagination?.skip || 0,
    limit: req.queryConfig.pagination?.take || 10
  })
}
