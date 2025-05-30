import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerOrder from '../../../../../links/seller-order'
import { AdminGetSellerOrdersParamsType } from '../../validators'

export const GET = async (
  req: MedusaRequest<AdminGetSellerOrdersParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerProducts, metadata } = await query.graph({
    entity: sellerOrder.entryPoint,
    fields: req.queryConfig.fields.map((field) => `order.${field}`),
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    products: sellerProducts.map((product) => product.product),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
