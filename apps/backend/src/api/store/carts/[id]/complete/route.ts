import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { HttpTypes } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { splitAndCompleteCartWorkflow } from '../../../../../workflows/order/workflows'

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.StoreCompleteCartResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const cart_id = req.params.id

  const { result } = await splitAndCompleteCartWorkflow(req.scope).run({
    input: { id: cart_id },
    context: { transactionId: cart_id },
    throwOnError: false
  })

  const { data } = await query.graph({
    entity: 'order_set',
    fields: req.remoteQueryConfig.fields,
    filters: { id: result.id }
  })

  // TODO: Compose orders and return full order set response
  res.json({
    order_set: data
  })
}
