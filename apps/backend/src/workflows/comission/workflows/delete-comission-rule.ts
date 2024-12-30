import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { deleteComissionRuleStep } from '../steps'

export const deleteComissionRuleWorkflow = createWorkflow(
  'delete-comission-rule',
  function (id: string) {
    return new WorkflowResponse(deleteComissionRuleStep(id))
  }
)
