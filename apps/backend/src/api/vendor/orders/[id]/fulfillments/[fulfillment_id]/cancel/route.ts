import { cancelOrderFulfillmentWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await cancelOrderFulfillmentWorkflow.run({
    container: req.scope,
    input: {
      order_id: req.params.id,
      fulfillment_id: req.params.fulfillment_id,
      canceled_by: req.auth_context.actor_id
    }
  })

  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ order })
}
