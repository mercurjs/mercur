import { NextFunction } from 'express'

import { MedusaRequest } from '@medusajs/framework'
import { MedusaError } from '@medusajs/framework/utils'

import { CONFIGURATION_MODULE } from '../../../../modules/configuration'
import ConfigurationModuleService from '../../../../modules/configuration/service'
import { ConfigurationRuleType } from '../../../../modules/configuration/types'

export function checkConfigurationRule(
  rule_type: ConfigurationRuleType,
  expected_value: boolean
) {
  return async (req: MedusaRequest, _, next: NextFunction) => {
    const configurationService =
      req.scope.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)

    const value = await configurationService.isRuleEnabled(rule_type)

    if (value !== expected_value) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'This feature is disabled!'
      )
    }
    return next()
  }
}
