import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { CONFIGURATION_MODULE } from '../../../modules/configuration'
import ConfigurationModuleService from '../../../modules/configuration/service'
import { AdminCreateRuleType } from './validators'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: configuration_rules, metadata } = await query.graph({
    entity: 'configuration_rule',
    fields: ['id', 'rule_type', 'is_enabled'],
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    configuration_rules,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

export const POST = async (
  req: MedusaRequest<AdminCreateRuleType>,
  res: MedusaResponse
) => {
  const service =
    req.scope.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)

  const configuration_rule = await service.createConfigurationRules([
    req.validatedBody
  ])

  res.status(201).json({ configuration_rule })
}
