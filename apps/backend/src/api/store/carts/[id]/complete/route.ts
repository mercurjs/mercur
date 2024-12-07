import { splitAndCompleteCartWorkflow } from '#/workflows/cart/workflows'
import { getFormattedOrderSetListWorkflow } from '#/workflows/order-set/workflows'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cart_id = req.params.id

  const { result } = await splitAndCompleteCartWorkflow(req.scope).run({
    input: { id: cart_id },
    context: { transactionId: cart_id }
  })

  const {
    result: { data }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: { filters: { id: result.id } }
  })

  res.json({
    order_set: data[0]
  })
}
