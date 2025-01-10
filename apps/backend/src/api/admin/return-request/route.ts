import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerReturnRequest from '../../../links/seller-return-request'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orderReturnRequests, metadata } = await query.graph({
    entity: sellerReturnRequest.entryPoint,
    fields: req.remoteQueryConfig.fields.map(
      (field) => `order_return_request.${field}`
    ),
    filters: req.filterableFields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    order_return_request: orderReturnRequests.map(
      (rel) => rel.order_return_request
    ),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
