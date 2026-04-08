import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { CreateServiceFeeDTO } from "@mercurjs/types"

import { createServiceFeesStep } from "../steps/create-service-fees"

export const createServiceFeesWorkflowId = "create-service-fees"

export const createServiceFeesWorkflow = createWorkflow(
  createServiceFeesWorkflowId,
  function (input: CreateServiceFeeDTO[]) {
    const serviceFees = createServiceFeesStep(input)
    return new WorkflowResponse(serviceFees)
  }
)
