import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateConfigurationRuleDTO } from '../../../modules/configuration/types'
import { createConfigurationRuleStep } from '../steps'

export const createConfigurationRuleWorkflow = createWorkflow(
  'create-configuration-rule',
  function (input: CreateConfigurationRuleDTO) {
    return new WorkflowResponse(createConfigurationRuleStep(input))
  }
)
