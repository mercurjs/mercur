import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"

import { CaptureDTO, CaptureStatus } from "../../../types/common"
import { CaptureAction, actionFor } from "../utils/capture-action"
import { syncCapturesWorkflow } from "./sync-captures"

export type ProcessCapturesWorkflowInput = {
  order_group_id?: string
}

export type ProcessCapturesWorkflowOutput = {
  settle: { order_group_id: string; capture_id: string; action: CaptureAction }[]
  stats: { synced: number; pending: number; expired: number }
}

export const processCapturesWorkflowId = "process-stripe-captures"

/**
 * Refreshes every open capture and returns the order groups whose cart
 * payment is due: captured once its orders are all decided (or the
 * authorization is about to expire), released once they were all canceled.
 */
export const processCapturesWorkflow = createWorkflow(
  processCapturesWorkflowId,
  function (input: ProcessCapturesWorkflowInput) {
    const synced = syncCapturesWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => ({
        order_group_ids: input.order_group_id ? [input.order_group_id] : undefined,
      })),
    })

    return new WorkflowResponse(
      transform({ synced }, ({ synced }): ProcessCapturesWorkflowOutput => {
        const rows = synced as CaptureDTO[]
        return {
          settle: rows.flatMap((row) => {
            const action = actionFor(row)
            return action ? [{ order_group_id: row.order_group_id, capture_id: row.id, action }] : []
          }),
          stats: {
            synced: rows.length,
            pending: rows.filter((row) => row.status === CaptureStatus.PENDING).length,
            expired: rows.filter((row) => row.status === CaptureStatus.EXPIRED).length,
          },
        }
      })
    )
  }
)
