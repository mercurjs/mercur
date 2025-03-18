import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'
import { createAndCompleteReturnOrderWorkflow } from '@medusajs/medusa/core-flows'

import returnRequestOrder from '../../../links/return-request-order'
import { OrderReturnRequestDTO } from '../../../modules/order-return-request/types'

export const createReturnObjectStep = createStep(
  'create-return-object',
  async (request: OrderReturnRequestDTO, { container }) => {
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
        order_return_request_id: request.id
      }
    })

    await createAndCompleteReturnOrderWorkflow.run({
      container,
      input: {
        order_id: order_id,
        created_by: order_return_request.customer_id,
        note: order_return_request.customer_note,
        return_shipping: {
          option_id: order_return_request.shipping_option_id
        },
        items: order_return_request.line_items.map((item) => {
          return { id: item.line_item_id, quantity: item.quantity }
        })
      }
    })

    return new StepResponse()
  }
)
