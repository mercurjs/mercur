import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { CreateOrderReturnRequestDTO } from '@mercurjs/framework'

import returnRequestOrder from '../../../links/return-request-order'
import { listSellerReturnShippingOptionsForOrderWorkflow } from '../../cart/workflows'

export const validateOrderReturnRequestStep = createStep(
  'validate-order-return-request',
  async (input: CreateOrderReturnRequestDTO, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [returnRequest]
    } = await query.graph({
      entity: returnRequestOrder.entryPoint,
      fields: ['return_request_id'],
      filters: {
        order_id: input.order_id
      }
    })

    if (returnRequest) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        'Order return request already exists'
      )
    }

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

    const { result: availableShippingOptions } =
      await listSellerReturnShippingOptionsForOrderWorkflow.run({
        container,
        input: {
          order_id: input.order_id
        }
      })

    if (
      !availableShippingOptions
        .map((option) => option.id)
        .includes(input.shipping_option_id)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Invalid shipping option'
      )
    }

    const reason_ids = [
      ...new Set(input.line_items.map((item) => item.reason_id))
    ]

    const { data: reasons } = await query.graph({
      entity: 'return_reason',
      fields: ['id'],
      filters: {
        id: reason_ids
      }
    })

    if (reasons.length !== reason_ids.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid reason')
    }

    return new StepResponse(true)
  }
)
