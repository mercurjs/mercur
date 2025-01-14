import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { CONFIGURATION_MODULE } from '../../../../modules/configuration'
import ConfigurationModuleService from '../../../../modules/configuration/service'
import { AdminUpdateRuleType } from '../validators'

export const POST = async (
  req: MedusaRequest<AdminUpdateRuleType>,
  res: MedusaResponse
) => {
  const service =
    req.scope.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)

  const configuration_rule = await service.updateConfigurationRules([
    {
      id: req.params.id,
      ...req.validatedBody
    }
  ])

  res.json({ configuration_rule })
}
