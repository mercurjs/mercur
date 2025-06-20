import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerCustomerGroup from '../../../../../links/seller-customer-group'
import { AdminGetSellerCustomerGroupsParamsType } from '../../validators'

export const GET = async (
  req: MedusaRequest<AdminGetSellerCustomerGroupsParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerGroups, metadata } = await query.graph({
    entity: sellerCustomerGroup.entryPoint,
    fields: req.queryConfig.fields.map((field) => `customer_group.${field}`),
    filters: {
      seller_id: req.params.id,
      deleted_at: {
        $eq: null
      }
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    customer_groups: sellerGroups.map((group) => group.customer_group),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
