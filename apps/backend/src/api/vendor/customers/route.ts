import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { selectSellerCustomers } from '../../../modules/seller/utils'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { customers, count } = await selectSellerCustomers(
    req.scope,
    seller.id,
    {
      skip: req.remoteQueryConfig.pagination.skip,
      take: req.remoteQueryConfig.pagination.take || 50
    }
  )

  res.json({
    customers,
    count: count,
    offset: req.remoteQueryConfig.pagination.skip,
    limit: req.remoteQueryConfig.pagination.take
  })
}
