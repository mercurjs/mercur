import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"

import { CaptureAction, settleCaptureStep } from "../steps/settle-captures"
import { syncCapturesStep } from "../steps/sync-captures"

export type SettleOrderGroupPaymentWorkflowInput = {
  order_group_id: string
  action: CaptureAction
}

export const settleOrderGroupPaymentWorkflowId = "settle-stripe-order-group-payment"

/** Captures or releases one order group's cart payment now, on the operator's call. */
export const settleOrderGroupPaymentWorkflow = createWorkflow(
  settleOrderGroupPaymentWorkflowId,
  function (input: SettleOrderGroupPaymentWorkflowInput) {
    const syncInput = transform({ input }, ({ input }) => ({ order_group_ids: [input.order_group_id] }))
    syncCapturesStep(syncInput)

    return new WorkflowResponse(settleCaptureStep(input))
  }
)
