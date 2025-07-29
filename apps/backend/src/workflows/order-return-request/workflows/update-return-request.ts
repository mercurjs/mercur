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
    when(input, (input) => input.status === 'refunded').then(() => {
      proceedReturnRequestWorkflow.runAsStep({ input })
    })

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
