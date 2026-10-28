import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { createOrderPayoutsWorkflow } from "@mercurjs/core/workflows"

import { setCheckpointStep } from "../../common/steps/set-checkpoint"
import { resolveRequiredFulfillmentStep } from "../steps/resolve-required-fulfillment"
import { PAYOUTS_CHECKPOINT, selectPayoutOrdersStep } from "../steps/select-payout-orders"
import { JobStats } from "../../../utils/run-job"

export type ProcessPayoutsWorkflowInput = {
  order_ids?: string[]
}

export const processPayoutsWorkflowId = "process-stripe-payouts"

/**
 * Pays sellers through core's payout workflow: the held and failed backlog
 * first, then orders created since the last run.
 */
export const processPayoutsWorkflow = createWorkflow(
  processPayoutsWorkflowId,
  function (input: ProcessPayoutsWorkflowInput) {
    const selection = selectPayoutOrdersStep(input)
    const requiredFulfillmentStatus = resolveRequiredFulfillmentStep()

    const payoutsInput = transform(
      { selection, requiredFulfillmentStatus },
      ({ selection, requiredFulfillmentStatus }) => ({
        order_ids: selection.order_ids,
        required_fulfillment_status: requiredFulfillmentStatus,
      })
    )
    const payouts = createOrderPayoutsWorkflow.runAsStep({ input: payoutsInput })

    const checkpoint = transform({ selection }, ({ selection }) => ({
      key: PAYOUTS_CHECKPOINT,
      value: selection.checkpoint,
    }))
    setCheckpointStep(checkpoint)

    const stats = transform({ selection, payouts }, ({ selection, payouts }): JobStats => ({
      ...selection.stats,
      ...payouts.counts,
      dispatched: payouts.payouts.length,
      ...(selection.checkpoint ? { checkpoint: selection.checkpoint } : {}),
    }))

    return new WorkflowResponse(stats)
  }
)
