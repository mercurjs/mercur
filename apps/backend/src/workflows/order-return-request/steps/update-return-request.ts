import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { ORDER_RETURN_MODULE } from '../../../modules/order-return-request'
import OrderReturnModuleService from '../../../modules/order-return-request/service'
import {
  AdminUpdateOrderReturnRequestDTO,
  VendorUpdateOrderReturnRequestDTO
} from '../../../modules/order-return-request/types'

export const updateOrderReturnRequestStep = createStep(
  'update-order-return-request',
  async (
    input: VendorUpdateOrderReturnRequestDTO | AdminUpdateOrderReturnRequestDTO,
    { container }
  ) => {
    const service =
      container.resolve<OrderReturnModuleService>(ORDER_RETURN_MODULE)

    //@ts-ignore
    const request = await service.updateOrderReturnRequests(input)

    return new StepResponse(request, request.id)
  }
)
