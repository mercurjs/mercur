import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { UpdateServiceFeeDTO } from "@mercurjs/types"

import { updateServiceFeesStep } from "../steps/update-service-fees"

export const updateServiceFeesWorkflowId = "update-service-fees"

export const updateServiceFeesWorkflow = createWorkflow(
  updateServiceFeesWorkflowId,
  function (input: UpdateServiceFeeDTO[]) {
    const serviceFees = updateServiceFeesStep(input)
    return new WorkflowResponse(serviceFees)
  }
)
