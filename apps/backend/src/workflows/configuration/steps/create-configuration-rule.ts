import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { CONFIGURATION_MODULE } from '@mercurjs/configuration'
import { ConfigurationModuleService } from '@mercurjs/configuration'
import { CreateConfigurationRuleDTO } from '@mercurjs/framework'

export const createConfigurationRuleStep = createStep(
  'create-configuration-rule',
  async (input: CreateConfigurationRuleDTO, { container }) => {
    const service =
      container.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)

    const configuration_rule = await service.createConfigurationRules(input)

    return new StepResponse(configuration_rule, configuration_rule.id)
  },
  async (id: string, { container }) => {
    const service =
      container.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)
    await service.deleteConfigurationRules(id)
  }
)
