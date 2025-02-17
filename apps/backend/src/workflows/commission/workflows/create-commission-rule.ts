import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateCommissionRuleDTO } from '../../../modules/commission/types'
import { checkForDuplicateStep, createCommissionRuleStep } from '../steps'

export const createCommissionRuleWorkflow = createWorkflow(
  'create-commission-rule',
  function (input: CreateCommissionRuleDTO) {
    checkForDuplicateStep(input)

    return new WorkflowResponse(createCommissionRuleStep(input))
  }
)
