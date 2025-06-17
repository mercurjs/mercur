import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { listCommissionLinesWorkflow } from '../../../workflows/commission/workflows'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const {
    result: { lines: commission_lines, count }
  } = await listCommissionLinesWorkflow(req.scope).run({
    input: {
      expand: true,
      pagination: {
        skip: req.queryConfig.pagination.skip,
        take: req.queryConfig.pagination.take || 20
      },
      filters: {
        ...req.filterableFields,
        seller_id: seller.id
      }
    }
  })

  res.json({
    commission_lines,
    count,
    offset: req.queryConfig.pagination.skip,
    limit: req.queryConfig.pagination.take
  })
}
