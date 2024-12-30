import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateComissionRuleDTO } from '../../../modules/comission/types'
import { updateComissionRuleStep } from '../steps'

export const updateComissionRuleWorkflow = createWorkflow(
  'update-comission-rule',
  function (input: UpdateComissionRuleDTO) {
    return new WorkflowResponse(updateComissionRuleStep(input))
  }
)
