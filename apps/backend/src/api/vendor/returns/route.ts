import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerReturn from '../../../links/seller-return'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: returns, metadata } = await query.graph({
    entity: sellerReturn.entryPoint,
    fields: req.remoteQueryConfig.fields.map((field) => `return.${field}`),
    filters: req.filterableFields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    returns,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
