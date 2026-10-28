import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { createOrderPayoutsWorkflow } from "@mercurjs/core/workflows"

import { JobStats } from "../../../utils/run-job"
import { setCheckpointsStep } from "../../common/steps"
import { resolveRequiredFulfillmentStep, selectPayoutOrdersStep } from "../steps"

export type ProcessPayoutsWorkflowInput = {
  order_ids?: string[]
}

export const processPayoutsWorkflowId = "process-stripe-payouts"

/**
 * Pays sellers through core's payout workflow: a page of the held and failed
 * backlog, the orders created since the last run, and the orders of sellers
 * whose payout account just became ready.
 */
export const processPayoutsWorkflow = createWorkflow(
  processPayoutsWorkflowId,
  function (input: ProcessPayoutsWorkflowInput) {
    const selection = selectPayoutOrdersStep(input)
    const requiredFulfillmentStatus = resolveRequiredFulfillmentStep()

    const payouts = createOrderPayoutsWorkflow.runAsStep({
      input: transform({ selection, requiredFulfillmentStatus }, ({ selection, requiredFulfillmentStatus }) => ({
        order_ids: selection.order_ids,
        required_fulfillment_status: requiredFulfillmentStatus,
      })),
    })

    setCheckpointsStep(selection.checkpoints)

    const stats = transform({ selection, payouts }, ({ selection, payouts }): JobStats => ({
      ...selection.stats,
      ...payouts.counts,
      processed: payouts.payouts.length,
    }))

    return new WorkflowResponse(stats)
  }
)
