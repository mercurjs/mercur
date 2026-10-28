import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { PayoutStatus } from "@mercurjs/types"

import { validatePayoutRetryStep } from "../steps"
import { createOrderPayoutsWorkflow } from "./create-order-payouts"
import { processPayoutWorkflow } from "./process-payout"

export type RetryPayoutWorkflowInput = {
  id: string
}

export const retryPayoutWorkflowId = "retry-payout"

/**
 * Retries a failed, held or pending payout. A failed or held order payout is
 * re-decided from its order, so one on hold only goes out once the order is
 * ready. A pending payout, and any payout without an order, is sent as is.
 */
export const retryPayoutWorkflow = createWorkflow(retryPayoutWorkflowId, function (input: RetryPayoutWorkflowInput) {
  const { data: payout } = useQueryGraphStep({
    entity: "payout",
    fields: ["id", "status", "order_id"],
    filters: { id: input.id },
    options: { isList: false, throwIfKeyNotFound: true },
  }).config({ name: "retry-payout-query" })

  validatePayoutRetryStep({ payout })

  when(
    "redecide-order-payout",
    { payout },
    ({ payout }) => !!payout.order_id && payout.status !== PayoutStatus.PENDING
  ).then(() => {
    createOrderPayoutsWorkflow.runAsStep({
      input: transform({ payout }, ({ payout }) => ({ order_ids: [payout.order_id as string] })),
    })
  })

  when(
    "send-payout",
    { payout },
    ({ payout }) => !payout.order_id || payout.status === PayoutStatus.PENDING
  ).then(() => {
    processPayoutWorkflow.runAsStep({
      input: transform({ payout }, ({ payout }) => ({ payout_ids: [payout.id] })),
    })
  })

  return new WorkflowResponse(payout)
})
