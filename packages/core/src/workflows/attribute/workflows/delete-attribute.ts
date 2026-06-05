import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { deleteAttributeStep, validateAttributeDeleteStep } from "../steps"

export const deleteAttributeWorkflowId = "delete-attribute-workflow"

type DeleteAttributeWorkflowInput = {
  id: string
}

export const deleteAttributeWorkflow = createWorkflow(
  deleteAttributeWorkflowId,
  (input: DeleteAttributeWorkflowInput) => {
    validateAttributeDeleteStep(input)
    return new WorkflowResponse(deleteAttributeStep(input))
  }
)
