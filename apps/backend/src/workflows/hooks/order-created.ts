import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createOrderWorkflow } from '@medusajs/medusa/core-flows'

import sellerOrder from '../../links/seller-order'
import { calculateCommissionWorkflow } from '../commission/workflows/calculate-commission'

createOrderWorkflow.hooks.orderCreated(async ({ order }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller]
  } = await query.graph({
    entity: sellerOrder.entryPoint,
    fields: ['seller_id'],
    filters: {
      order_id: order.id
    }
  })

  if (!seller) {
    return
  }

  await calculateCommissionWorkflow.run({
    input: {
      order_id: order.id,
      seller_id: seller.seller_id
    },
    container
  })
})
