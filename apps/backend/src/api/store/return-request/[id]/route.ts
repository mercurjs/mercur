import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [orderReturnRequest]
  } = await query.graph({
    entity: 'order_return_request',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id,
      customer_id: req.auth_context.actor_id
    }
  })

  res.json({ orderReturnRequest })
}
