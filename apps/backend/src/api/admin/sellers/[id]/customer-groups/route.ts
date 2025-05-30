import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerCustomerGroup from '../../../../../links/seller-customer-group'
import { AdminGetSellerCustomerGroupsParamsType } from '../../validators'

export const GET = async (
  req: MedusaRequest<AdminGetSellerCustomerGroupsParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerProducts, metadata } = await query.graph({
    entity: sellerCustomerGroup.entryPoint,
    fields: req.queryConfig.fields.map((field) => `customer_group.${field}`),
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
