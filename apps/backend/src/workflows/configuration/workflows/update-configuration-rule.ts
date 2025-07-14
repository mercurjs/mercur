import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { UpdateConfigurationRuleDTO } from '@mercurjs/framework'

import { updateConfigurationRuleStep } from '../steps/update-configuration-rule'

/**
 * Updates a configuration rule and returns the updated rule.
 */
export const updateConfigurationRuleWorkflow = createWorkflow(
  'update-configuration-rule',
  function (input: UpdateConfigurationRuleDTO) {
    return new WorkflowResponse(updateConfigurationRuleStep(input))
  }
)
