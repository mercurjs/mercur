import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateCommissionRuleDTO } from '../../../modules/commission/types'
import { updateCommissionRuleStep } from '../steps'

export const updateCommissionRuleWorkflow = createWorkflow(
  'update-commission-rule',
  function (input: UpdateCommissionRuleDTO) {
    return new WorkflowResponse(updateCommissionRuleStep(input))
  }
)
