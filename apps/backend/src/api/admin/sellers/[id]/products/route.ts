import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerProduct from '../../../../../links/seller-product'
import { AdminGetSellerProductsParamsType } from '../../validators'

export const GET = async (
  req: MedusaRequest<AdminGetSellerProductsParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerProducts, metadata } = await query.graph({
    entity: sellerProduct.entryPoint,
    fields: req.queryConfig.fields.map((field) => `product.${field}`),
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
