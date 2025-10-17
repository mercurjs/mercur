import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'

import { RefundSplitOrderPaymentsDTO } from '@mercurjs/framework'

import { updateSplitOrderPaymentsStep } from '../steps'
import { validateRefundSplitOrderPaymentStep } from '../steps/validate-refund-split-order-payment'
import { partialPaymentRefundWorkflow } from './partial-payment-refund'

export const refundSplitOrderPaymentWorkflow = createWorkflow(
  {
    name: 'refund-split-order-payment'
  },
  function (input: RefundSplitOrderPaymentsDTO) {
    const updatePayload = validateRefundSplitOrderPaymentStep(input)
    const splitOrderPayment = updateSplitOrderPaymentsStep(
      transform(updatePayload, (updatePayload) => [updatePayload])
    )
    partialPaymentRefundWorkflow.runAsStep({ input })
    return new WorkflowResponse(splitOrderPayment)
  }
)
