import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { deleteCommissionRuleStep } from '../steps'

export const deleteCommissionRuleWorkflow = createWorkflow(
  'delete-commission-rule',
  function (id: string) {
    return new WorkflowResponse(deleteCommissionRuleStep(id))
  }
)
