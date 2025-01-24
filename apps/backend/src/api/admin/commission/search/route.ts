import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { COMMISSION_MODULE } from '../../../../modules/commission'
import CommissionModuleService from '../../../../modules/commission/service'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const service = req.scope.resolve<CommissionModuleService>(COMMISSION_MODULE)

  const comission_rules = await service.listCommissionRules({
    q: req.query.q
  })

  res.json({
    comission_rules
  })
}
