import { NextFunction } from 'express'

import {
  MedusaContainer,
  MedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { MedusaError } from '@medusajs/framework/utils'

import { CONFIGURATION_MODULE } from '../../../../modules/configuration'
import ConfigurationModuleService from '../../../../modules/configuration/service'
import { ConfigurationRuleType } from '../../../../modules/configuration/types'

export function getRuleValue(
  container: MedusaContainer,
  rule_type: ConfigurationRuleType
) {
  const configurationService =
    container.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)
  return configurationService.isRuleEnabled(rule_type)
}

export function checkConfigurationRule(
  rule_type: ConfigurationRuleType,
  expected_value: boolean
) {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    if ((await getRuleValue(req.scope, rule_type)) !== expected_value) {
      res.status(404).json({
        message: `This feature is disabled!`,
        type: MedusaError.Types.NOT_FOUND
      })
      return
    }

    return next()
  }
}
