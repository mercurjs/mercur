import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerOrder from '../../../../../links/seller-order'
import { getVendorOrdersListWorkflow } from '../../../../../workflows/order/workflows'
import { AdminGetSellerOrdersParamsType } from '../../validators'

export const GET = async (
  req: MedusaRequest<AdminGetSellerOrdersParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orderRelations } = await query.graph({
    entity: sellerOrder.entryPoint,
    fields: ['order_id'],
    filters: {
      seller_id: req.params.id,
      deleted_at: {
        $eq: null
      }
    }
  })

  const { result } = await getVendorOrdersListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      variables: {
        filters: {
          ...req.filterableFields,
          id: orderRelations.map((relation) => relation.order_id)
        },
        ...req.queryConfig.pagination
      }
    }
  })

  const { rows, metadata } = result as any

  res.json({
    orders: rows,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
