import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import orderSetOrder from '../../../links/order-set-order'
import { getFormattedOrderSetListWorkflow } from '../../../workflows/order-set/workflows'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { filterableFields, queryConfig } = req

  if (filterableFields['order_id']) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [order_set]
    } = await query.graph({
      entity: orderSetOrder.entryPoint,
      fields: ['order_set_id'],
      filters: {
        order_id: req.filterableFields['order_id']
      }
    })

    delete filterableFields['order_id']
    filterableFields['id'] = order_set.order_set_id
  }

  const {
    result: { data, metadata }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: {
      fields: queryConfig.fields,
      filters: filterableFields,
      pagination: queryConfig.pagination
    }
  })

  res.json({
    order_sets: data,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
