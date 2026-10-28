import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"

import { SyncCapturesStepInput, syncCapturesStep } from "../steps/sync-captures"

export const syncCapturesWorkflowId = "sync-stripe-captures"

export const syncCapturesWorkflow = createWorkflow(
  syncCapturesWorkflowId,
  function (input: SyncCapturesStepInput) {
    return new WorkflowResponse(syncCapturesStep(input))
  }
)
