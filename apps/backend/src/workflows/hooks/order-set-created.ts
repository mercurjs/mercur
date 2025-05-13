import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerOrder from '../../links/seller-order'
import { splitAndCompleteCartWorkflow } from '../cart/workflows'
import { calculateCommissionWorkflow } from '../commission/workflows'

splitAndCompleteCartWorkflow.hooks.orderSetCreated(
  async ({ orderSetId }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [set]
    } = await query.graph({
      entity: 'order_set',
      fields: ['orders.id'],
      filters: {
        id: orderSetId
      }
    })

    const ordersCreated = set.orders.map((o) => o.id)

    for (const order_id of ordersCreated) {
      const {
        data: [seller]
      } = await query.graph({
        entity: sellerOrder.entryPoint,
        fields: ['seller_id'],
        filters: {
          order_id: order_id
        }
      })

      if (!seller) {
        return
      }

      await calculateCommissionWorkflow.run({
        input: {
          order_id: order_id,
          seller_id: seller.seller_id
        },
        container
      })
    }
  }
)
