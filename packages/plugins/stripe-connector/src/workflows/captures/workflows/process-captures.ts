import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"

import { CaptureStatus } from "../../../types/common"
import { settleCapturesStep } from "../steps/settle-captures"
import { syncCapturesStep } from "../steps/sync-captures"
import { JobStats } from "../../../utils/run-job"

export type ProcessCapturesWorkflowInput = {
  order_group_id?: string
}

export const processCapturesWorkflowId = "process-stripe-captures"

/**
 * Refreshes every open capture, then captures the cart payment of each
 * order group whose orders are all decided (or whose authorization is about
 * to expire), and releases the ones whose orders were all canceled.
 */
export const processCapturesWorkflow = createWorkflow(
  processCapturesWorkflowId,
  function (input: ProcessCapturesWorkflowInput) {
    const syncInput = transform({ input }, ({ input }) => ({
      order_group_ids: input.order_group_id ? [input.order_group_id] : undefined,
    }))
    const synced = syncCapturesStep(syncInput)

    const settled = settleCapturesStep({ order_group_id: input.order_group_id })

    const stats = transform({ synced, settled }, ({ synced, settled }): JobStats => {
      const count = (status: CaptureStatus) => settled.filter((row) => row.status === status).length
      return {
        synced: synced.length,
        pending: synced.filter((row) => row.status === CaptureStatus.PENDING).length,
        expired: synced.filter((row) => row.status === CaptureStatus.EXPIRED).length,
        captured: count(CaptureStatus.CAPTURED),
        canceled: count(CaptureStatus.CANCELED),
        failed: count(CaptureStatus.FAILED),
      }
    })

    return new WorkflowResponse(stats)
  }
)
