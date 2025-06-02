import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerOrder from '../../../../../links/seller-order'
import { AdminGetSellerOrdersParamsType } from '../../validators'

export const GET = async (
  req: MedusaRequest<AdminGetSellerOrdersParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerOrders, metadata } = await query.graph({
    entity: sellerOrder.entryPoint,
    fields: req.queryConfig.fields.map((field) => `order.${field}`),
    filters: {
      seller_id: req.params.id
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    orders: sellerOrders.map((order) => order.order),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
