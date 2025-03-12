import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import {
  selectCustomersChartData,
  selectOrdersChartData
} from '../../../modules/seller/utils'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const orders = await selectOrdersChartData(req.scope, seller.id, [
    (req.validatedQuery.time_from as Date).toISOString(),
    (req.validatedQuery.time_to as Date).toISOString()
  ])

  const customers = await selectCustomersChartData(req.scope, seller.id, [
    (req.validatedQuery.time_from as Date).toISOString(),
    (req.validatedQuery.time_to as Date).toISOString()
  ])

  res.json({ orders, customers })
}
