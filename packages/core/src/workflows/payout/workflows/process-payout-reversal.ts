import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PayoutModuleEvents, PayoutReversalDTO, PayoutStatus } from "@mercurjs/types"

import { dispatchPayoutReversalsStep } from "../steps/dispatch-payout-reversal"

export type ProcessPayoutReversalWorkflowInput = {
  reversal_ids: string[]
}

export const processPayoutReversalWorkflowId = "process-payout-reversal"

export const failedReversalEvents = (reversals: PayoutReversalDTO[]) =>
  reversals
    .filter((reversal) => reversal.status === PayoutStatus.FAILED)
    .map((reversal) => ({
      id: reversal.id,
      payout_id: reversal.payout_id,
      refund_id: reversal.refund_id,
      amount: reversal.amount,
      status: reversal.status,
      status_reason: reversal.status_reason,
    }))

export const processPayoutReversalWorkflow = createWorkflow(
  processPayoutReversalWorkflowId,
  function (input: ProcessPayoutReversalWorkflowInput) {
    const reversals = dispatchPayoutReversalsStep({ reversal_ids: input.reversal_ids })

    const failed = transform({ reversals }, ({ reversals }) => failedReversalEvents(reversals))

    emitEventStep({ eventName: PayoutModuleEvents.PAYOUT_REVERSAL_FAILED, data: failed })

    return new WorkflowResponse(reversals)
  }
)
