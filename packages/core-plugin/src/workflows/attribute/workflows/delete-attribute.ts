import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { deleteAttributeStep } from "../steps"

export const deleteAttributeWorkflowId = "delete-attribute-workflow"

type DeleteAttributeWorkflowInput = {
  id: string
}

export const deleteAttributeWorkflow = createWorkflow(
  deleteAttributeWorkflowId,
  (input: DeleteAttributeWorkflowInput) => {
    return new WorkflowResponse(deleteAttributeStep(input))
  }
)
