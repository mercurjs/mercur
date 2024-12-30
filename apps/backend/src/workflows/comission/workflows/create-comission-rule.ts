import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateComissionRuleDTO } from '../../../modules/comission/types'
import { checkForDuplicateStep, createComissionRuleStep } from '../steps'

export const createComissionRuleWorkflow = createWorkflow(
  'create-comission-rule',
  function (input: CreateComissionRuleDTO) {
    checkForDuplicateStep(input)

    return new WorkflowResponse(createComissionRuleStep(input))
  }
)
