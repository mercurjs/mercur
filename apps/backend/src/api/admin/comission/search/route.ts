import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { COMISSION_MODULE } from '../../../../modules/comission'
import ComissionModuleService from '../../../../modules/comission/service'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const service = req.scope.resolve<ComissionModuleService>(COMISSION_MODULE)

  const comission_rules = await service.listComissionRules({
    q: req.query.q
  })

  res.json({
    comission_rules
  })
}
