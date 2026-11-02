import { WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"

import { CaptureStatus } from "../../../types/common"
import { updateStripeCapturesStep } from "../steps"

export type FailStripeCaptureWorkflowInput = {
  id: string
  status_reason: string
}

export const failStripeCaptureWorkflowId = "fail-stripe-capture"

/** Marks a capture failed so the next run retries it and the daily digest reports it. */
export const failStripeCaptureWorkflow = createWorkflow(
  failStripeCaptureWorkflowId,
  function (input: FailStripeCaptureWorkflowInput) {
    const updated = updateStripeCapturesStep(
      transform({ input }, ({ input }) => [
        { id: input.id, status: CaptureStatus.FAILED, status_reason: input.status_reason.slice(0, 1024) },
      ])
    )
    return new WorkflowResponse(transform({ updated }, ({ updated }) => updated[0]))
  }
)
