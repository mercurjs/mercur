import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { CreateOrderReturnRequestDTO } from '../../../modules/order-return-request/types'

export const validateOrderReturnRequestStep = createStep(
  'validate-order-return-request',
  async (input: CreateOrderReturnRequestDTO, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [order]
    } = await query.graph({
      entity: 'order',
      fields: ['items.id'],
      filters: {
        id: input.order_id
      }
    })

    const orderLineItems = order.items.map((i) => i.id)

    for (const item of input.line_items) {
      if (!orderLineItems.includes(item.line_item_id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_ARGUMENT,
          'Invalid line item'
        )
      }
    }

    return new StepResponse(true)
  }
)
