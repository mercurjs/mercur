import {
  WorkflowResponse,
  createHook,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import {
  AdminUpdateOrderReturnRequestDTO,
  VendorUpdateOrderReturnRequestDTO
} from '../../../modules/order-return-request/types'
import { updateOrderReturnRequestStep } from '../steps'

export const updateOrderReturnRequestWorkflow = createWorkflow(
  'update-order-return-request',
  function (
    input: VendorUpdateOrderReturnRequestDTO | AdminUpdateOrderReturnRequestDTO
  ) {
    const request = updateOrderReturnRequestStep(input)
    const orderReturnRequestUpdatedHook = createHook(
      'orderReturnRequestUpdated',
      {
        requestId: request.id
      }
    )

    return new WorkflowResponse(request, {
      hooks: [orderReturnRequestUpdatedHook]
    })
  }
)
