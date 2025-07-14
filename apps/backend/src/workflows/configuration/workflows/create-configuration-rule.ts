import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateConfigurationRuleDTO } from '@mercurjs/framework'

import { createConfigurationRuleStep } from '../steps'

/**
 * Creates a configuration rule and returns the created rule.
 */
export const createConfigurationRuleWorkflow = createWorkflow(
  'create-configuration-rule',
  function (input: CreateConfigurationRuleDTO) {
    return new WorkflowResponse(createConfigurationRuleStep(input))
  }
)
