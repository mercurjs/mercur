import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PayoutModuleEvents } from "@mercurjs/types"

import { dispatchPayoutReversalsStep } from "../steps/dispatch-payout-reversal"
import { evaluatePayoutReversalsStep } from "../steps/evaluate-order-payouts"
import { failedReversalEvents } from "./process-payout-reversal"

export type CreatePayoutReversalsWorkflowInput = {
  order_ids: string[]
}

export const createPayoutReversalsWorkflowId = "create-payout-reversals"

/**
 * Takes the refunded share back from the seller: one reversal per refund on
 * an order whose payout is paid, net of the commission on that share.
 */
export const createPayoutReversalsWorkflow = createWorkflow(
  createPayoutReversalsWorkflowId,
  function (input: CreatePayoutReversalsWorkflowInput) {
    const evaluation = evaluatePayoutReversalsStep({ order_ids: input.order_ids })

    const reversals = dispatchPayoutReversalsStep({ reversal_ids: evaluation.pending })

    const failed = transform({ reversals }, ({ reversals }) => failedReversalEvents(reversals))

    emitEventStep({ eventName: PayoutModuleEvents.PAYOUT_REVERSAL_FAILED, data: failed })

    const result = transform({ evaluation, reversals }, ({ evaluation, reversals }) => ({
      counts: evaluation.counts,
      reversals,
    }))

    return new WorkflowResponse(result)
  }
)
