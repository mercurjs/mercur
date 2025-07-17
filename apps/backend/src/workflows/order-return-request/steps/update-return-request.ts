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

    const previousData = await service.retrieveOrderReturnRequest(input.id)

    const request: OrderReturnRequestDTO =
      await service.updateOrderReturnRequests(input)

    return new StepResponse(request[0], previousData)
  },
  async (previousData: OrderReturnRequestDTO, { container }) => {
    const service =
      container.resolve<OrderReturnModuleService>(ORDER_RETURN_MODULE)

    // @ts-expect-error - incomplete type
    await service.updateOrderReturnRequests(previousData)
  }
)
