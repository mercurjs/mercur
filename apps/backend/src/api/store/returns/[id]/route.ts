import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { storeReturnFields } from '../query-config'

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: storeReturnFields.map((field) => `returns.${field}`),
    filters: {
      customer_id: req.auth_context.actor_id,
      returns: {
        id: req.params.id
      }
    }
  })

  res.json({
    return: order.returns[0]
  })
}
