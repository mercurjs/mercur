import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { SELLER_MODULE } from '@mercurjs/seller'

import returnRequestOrder from '../../links/return-request-order'
import { updateOrderReturnRequestWorkflow } from '../order-return-request/workflows'

updateOrderReturnRequestWorkflow.hooks.orderReturnRequestUpdated(
  async ({ requestId }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [{ order_id, order_return_request }]
    } = await query.graph({
      entity: returnRequestOrder.entryPoint,
      fields: [
        'order_id',
        'order_return_request.*',
        'order_return_request.line_items.*',
        'order_return_request.seller.id'
      ],
      filters: {
        order_return_request_id: requestId
      }
    })

    const {
      data: [order]
    } = await query.graph({
      entity: 'order',
      fields: ['returns.id'],
      filters: {
        id: order_id
      }
    })

    const returns = Array.isArray(order.returns)
      ? order.returns
      : [order.returns]

    const links = returns.map((r) => {
      return {
        [SELLER_MODULE]: {
          seller_id: order_return_request.seller.id
        },
        [Modules.ORDER]: {
          return_id: r.id
        }
      }
    })

    const linkService = container.resolve(ContainerRegistrationKeys.LINK)
    await linkService.create(links)
  }
)
