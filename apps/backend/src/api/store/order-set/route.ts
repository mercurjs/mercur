import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { defaultStoreRetrieveOrderSetFields } from './query-config'

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: order_sets, metadata } = await query.graph({
    entity: 'order_set',
    fields: defaultStoreRetrieveOrderSetFields,
    filters: {
      customer_id: req.auth_context.actor_id
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    order_sets,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
