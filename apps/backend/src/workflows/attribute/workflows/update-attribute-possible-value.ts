import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { UpdateAttributeValueDTO } from '@mercurjs/framework'

import { updateAttributePossibleValueStep } from '../steps'

export const updateAttributePossibleValueWorkflowId =
  'update-attribute-possible-value'

type WorkflowInput = UpdateAttributeValueDTO

export const updateAttributePossibleValueWorkflow = createWorkflow(
  updateAttributePossibleValueWorkflowId,
  (input: WorkflowInput) => {
    const updated = updateAttributePossibleValueStep(input)
    return new WorkflowResponse(updated)
  }
)
