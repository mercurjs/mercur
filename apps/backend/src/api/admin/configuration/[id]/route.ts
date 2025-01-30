import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { updateConfigurationRuleWorkflow } from '../../../../workflows/configuration/workflows'
import { AdminUpdateRuleType } from '../validators'

export const POST = async (
  req: MedusaRequest<AdminUpdateRuleType>,
  res: MedusaResponse
) => {
  const { result: configuration_rule } =
    await updateConfigurationRuleWorkflow.run({
      container: req.scope,
      input: { ...req.validatedBody, id: req.params.id }
    })

  res.json({ configuration_rule })
}
