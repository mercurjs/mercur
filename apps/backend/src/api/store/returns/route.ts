import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { storeReturnFields } from './query-config'

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: relations, metadata } = await query.graph({
    entity: 'order',
    fields: storeReturnFields.map((field) => `returns.${field}`),
    filters: {
      customer_id: req.auth_context.actor_id,
      returns: {
        created_at: {
          $ne: null
        }
      }
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    returns: relations.flatMap((relation) => relation.returns),
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
