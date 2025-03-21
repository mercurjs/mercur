import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { ORDER_RETURN_MODULE } from '../../../modules/order-return-request'
import OrderReturnModuleService from '../../../modules/order-return-request/service'
import { CreateOrderReturnRequestDTO } from '../../../modules/order-return-request/types'

export const createOrderReturnRequestStep = createStep(
  'create-order-return-request',
  async (input: CreateOrderReturnRequestDTO, { container }) => {
    const service =
      container.resolve<OrderReturnModuleService>(ORDER_RETURN_MODULE)

    // @ts-expect-error Expects existing line item ids
    const request = await service.createOrderReturnRequests(input)

    return new StepResponse(request, request.id)
  }
)
