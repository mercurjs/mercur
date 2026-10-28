import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"

import { CaptureAction } from "../utils/capture-action"
import { settleStripeCaptureWorkflow } from "./settle-stripe-capture"
import { syncCapturesWorkflow } from "./sync-captures"

export type SettleOrderGroupPaymentWorkflowInput = {
  order_group_id: string
  action: CaptureAction
}

export const settleOrderGroupPaymentWorkflowId = "settle-stripe-order-group-payment"

/** Captures or releases one order group's cart payment now, on the operator's call. */
export const settleOrderGroupPaymentWorkflow = createWorkflow(
  settleOrderGroupPaymentWorkflowId,
  function (input: SettleOrderGroupPaymentWorkflowInput) {
    syncCapturesWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => ({ order_group_ids: [input.order_group_id] })),
    })

    const settled = settleStripeCaptureWorkflow.runAsStep({ input })

    return new WorkflowResponse(settled)
  }
)
