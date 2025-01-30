import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { CONFIGURATION_MODULE } from '../../../modules/configuration'
import ConfigurationModuleService from '../../../modules/configuration/service'
import { UpdateConfigurationRuleDTO } from '../../../modules/configuration/types'

export const updateConfigurationRuleStep = createStep(
  'update-configuration-rule',
  async (input: UpdateConfigurationRuleDTO, { container }) => {
    const service =
      container.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)

    const configuration_rule = await service.updateConfigurationRules(input)

    return new StepResponse(configuration_rule, configuration_rule.id)
  }
)
