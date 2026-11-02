import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"

import { SetCheckpointsStepInput, setCheckpointsStep } from "../steps/set-checkpoints"

export const setStripeCheckpointsWorkflowId = "set-stripe-connector-checkpoints"

export const setStripeCheckpointsWorkflow = createWorkflow(
  setStripeCheckpointsWorkflowId,
  function (input: { checkpoints: SetCheckpointsStepInput }) {
    setCheckpointsStep(input.checkpoints)
    return new WorkflowResponse(void 0)
  }
)
