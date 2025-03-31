import { MedusaRequest, MedusaResponse, container } from '@medusajs/framework'

import { splitAndCompleteCartWorkflow } from '../../../workflows/cart/workflows'
import { getFormattedOrderSetListWorkflow } from '../../../workflows/order-set/workflows'
import { createCart, createPayments, createShippingOptions } from './utils'
import { CreateQuickOrderType } from './validators'

export const POST = async (
  req: MedusaRequest<CreateQuickOrderType>,
  res: MedusaResponse
) => {
  const cart = await createCart(req.validatedBody, req.scope)
  await createShippingOptions(cart.id, container)
  await createPayments(cart.id, container)

  const { result } = await splitAndCompleteCartWorkflow.run({
    container: req.scope,
    input: {
      id: cart.id
    }
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
