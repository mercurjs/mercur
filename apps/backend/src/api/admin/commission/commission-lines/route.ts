import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { listCommissionLinesWorkflow } from '../../../../workflows/commission/workflows'
import { AdminGetCommissionLinesParamsType } from '../validators'

export async function GET(
  req: MedusaRequest<AdminGetCommissionLinesParamsType>,
  res: MedusaResponse
): Promise<void> {
  const {
    result: { lines: commission_lines, count }
  } = await listCommissionLinesWorkflow(req.scope).run({
    input: {
      expand: true,
      pagination: {
        skip: req.queryConfig.pagination.skip,
        take: req.queryConfig.pagination.take || 20
      },
      filters: req.filterableFields
    }
  })

  res.json({
    commission_lines,
    count,
    offset: req.queryConfig.pagination.skip,
    limit: req.queryConfig.pagination.take
  })
}
