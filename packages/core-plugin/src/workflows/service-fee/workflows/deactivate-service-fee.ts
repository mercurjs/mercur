import {
  WorkflowResponse,
  createWorkflow,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import { deactivateServiceFeeStep } from "../steps/deactivate-service-fee"

export type DeactivateServiceFeeWorkflowInput = {
  id: string
  changed_by?: string
}

export const deactivateServiceFeeWorkflowId = "deactivate-service-fee"

export const deactivateServiceFeeWorkflow = createWorkflow(
  deactivateServiceFeeWorkflowId,
  (input: WorkflowData<DeactivateServiceFeeWorkflowInput>) => {
    const result = deactivateServiceFeeStep(input)
    return new WorkflowResponse(result)
  }
)
