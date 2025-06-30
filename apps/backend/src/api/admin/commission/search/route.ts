import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { COMMISSION_MODULE } from '@mercurjs/commission'
import { CommissionModuleService } from '@mercurjs/commission'

import { listCommissionRulesWorkflow } from '../../../../workflows/commission/workflows'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const service = req.scope.resolve<CommissionModuleService>(COMMISSION_MODULE)

  const ids = await service.listCommissionRules(
    {
      q: req.query.q
    },
    { select: ['id'] }
  )

  const { result } = await listCommissionRulesWorkflow.run({
    container: req.scope,
    input: {
      ids: ids.map((v) => v.id),
      pagination: req.queryConfig.pagination
    }
  })

  res.json({
    commission_rules: result.commission_rules,
    count: result.count,
    offset: req.queryConfig.pagination.skip,
    limit: req.queryConfig.pagination.take
  })
}
