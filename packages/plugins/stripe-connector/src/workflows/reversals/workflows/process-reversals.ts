import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { createPayoutReversalsWorkflow } from "@mercurjs/core/workflows"

import { JobStats } from "../../../utils/run-job"
import { setCheckpointsStep } from "../../common/steps"
import { selectReversalOrdersStep } from "../steps"

export type ProcessReversalsWorkflowInput = {
  order_ids?: string[]
}

export const processReversalsWorkflowId = "process-stripe-reversals"

/** Takes refunded shares back from sellers through core's reversal workflow. */
export const processReversalsWorkflow = createWorkflow(
  processReversalsWorkflowId,
  function (input: ProcessReversalsWorkflowInput) {
    const selection = selectReversalOrdersStep(input)

    const reversals = createPayoutReversalsWorkflow.runAsStep({
      input: transform({ selection }, ({ selection }) => ({ order_ids: selection.order_ids })),
    })

    setCheckpointsStep(selection.checkpoints)

    const stats = transform({ selection, reversals }, ({ selection, reversals }): JobStats => ({
      ...selection.stats,
      ...reversals.counts,
      orders: selection.order_ids.length,
      processed: reversals.reversals.length,
    }))

    return new WorkflowResponse(stats)
  }
)
