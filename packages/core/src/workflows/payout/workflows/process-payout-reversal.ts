import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PayoutModuleEvents, PayoutReversalDTO, PayoutStatus } from "@mercurjs/types"

import { processPayoutReversalsStep } from "../steps"

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
    const reversals = processPayoutReversalsStep({ ids: input.reversal_ids })

    emitEventStep({
      eventName: PayoutModuleEvents.PAYOUT_REVERSAL_FAILED,
      data: transform({ reversals }, ({ reversals }) => failedReversalEvents(reversals)),
    })

    return new WorkflowResponse(reversals)
  }
)
