import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import {
  AdminUpdateOrderReturnRequestDTO,
  OrderReturnRequestDTO,
  VendorUpdateOrderReturnRequestDTO
} from '@mercurjs/framework'
import {
  ORDER_RETURN_MODULE,
  OrderReturnModuleService
} from '@mercurjs/order-return-request'

export const updateOrderReturnRequestStep = createStep(
  'update-order-return-request',
  async (
    input: VendorUpdateOrderReturnRequestDTO | AdminUpdateOrderReturnRequestDTO,
    { container }
  ) => {
    const service =
      container.resolve<OrderReturnModuleService>(ORDER_RETURN_MODULE)

    const request: OrderReturnRequestDTO =
      await service.updateOrderReturnRequests(input)

    return new StepResponse(request, request.id)
  }
)
