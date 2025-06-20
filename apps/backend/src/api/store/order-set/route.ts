import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { getFormattedOrderSetListWorkflow } from '../../../workflows/order-set/workflows'
import { defaultStoreRetrieveOrderSetFields } from './query-config'

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: order_set_ids, metadata } = await query.graph({
    entity: 'order_set',
    fields: ['id'],
    filters: {
      customer_id: req.auth_context.actor_id
    },
    pagination: req.queryConfig.pagination
  })

  const {
    result: { data: order_sets }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: {
      filters: { id: order_set_ids.map((set) => set.id) },
      fields: defaultStoreRetrieveOrderSetFields
    }
  })

  res.json({
    order_sets,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
