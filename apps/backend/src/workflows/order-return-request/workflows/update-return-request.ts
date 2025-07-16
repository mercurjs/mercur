import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  when
} from '@medusajs/framework/workflows-sdk'

import {
  AdminUpdateOrderReturnRequestDTO,
  VendorUpdateOrderReturnRequestDTO
} from '@mercurjs/framework'

import { updateOrderReturnRequestStep } from '../steps'
import { proceedReturnRequestWorkflow } from './proceed-return-request'

export const updateOrderReturnRequestWorkflow = createWorkflow(
  'update-order-return-request',
  function (
    input: VendorUpdateOrderReturnRequestDTO | AdminUpdateOrderReturnRequestDTO
  ) {
    const request = updateOrderReturnRequestStep(input)

    when(request, (request) => request.status === 'refunded').then(() => {
      proceedReturnRequestWorkflow.runAsStep({ input: request })
    })

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
