import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'

import { RefundSplitOrderPaymentsDTO } from '../../../modules/split-order-payment/types'
import { updateSplitOrderPaymentsStep } from '../steps'
import { validateRefundSplitOrderPaymentStep } from '../steps/validate-refund-split-order-payment'

export const refundSplitOrderPaymentWorkflow = createWorkflow(
  {
    name: 'refund-split-order-payment'
  },
  function (input: RefundSplitOrderPaymentsDTO) {
    const updatePayload = validateRefundSplitOrderPaymentStep(input)
    const splitOrderPayment = updateSplitOrderPaymentsStep(
      transform(updatePayload, (updatePayload) => updatePayload[0])
    )

    const splitPaymentRefundedHook = createHook('splitPaymentRefunded', {
      id: splitOrderPayment[0].id,
      amount: input.amount
    })
    return new WorkflowResponse(splitOrderPayment, {
      hooks: [splitPaymentRefundedHook]
    })
  }
)
