import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { activatePendingServiceFeesStep } from "../steps/activate-pending-service-fees"

export const activatePendingServiceFeesWorkflowId =
  "activate-pending-service-fees"

export const activatePendingServiceFeesWorkflow = createWorkflow(
  activatePendingServiceFeesWorkflowId,
  function () {
    const activated = activatePendingServiceFeesStep()
    return new WorkflowResponse(activated)
  }
)
