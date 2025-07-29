import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import {
  AdminUpdateOrderReturnRequestDTO,
  VendorUpdateOrderReturnRequestDTO
} from '@mercurjs/framework'

import returnRequestOrder from '../../../links/return-request-order'

export const retrieveOrderFromReturnRequestStep = createStep(
  'retrieve-order-from-return-request',
  async (
    request:
      | VendorUpdateOrderReturnRequestDTO
      | AdminUpdateOrderReturnRequestDTO,
    { container }
  ) => {
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

    return new StepResponse({
      order_id,
      order_return_request
    })
  }
)
