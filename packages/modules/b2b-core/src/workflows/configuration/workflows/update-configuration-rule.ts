import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateConfigurationRuleDTO } from '@mercurjs/framework'

import { updateConfigurationRuleStep } from '../steps/update-configuration-rule'

export const updateConfigurationRuleWorkflow = createWorkflow(
  'update-configuration-rule',
  function (input: UpdateConfigurationRuleDTO) {
    return new WorkflowResponse(updateConfigurationRuleStep(input))
  }
)
