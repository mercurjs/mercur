import { addShippingMethodToCartWithourReplacementWorkflow } from '#/workflows/cart/workflows/add-shipping-method-to-cart'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const payload = req.body

  await addShippingMethodToCartWithourReplacementWorkflow(req.scope).run({
    input: {
      options: [{ id: payload.option_id, data: payload.data }],
      cart_id: req.params.id
    }
  })

  res.sendStatus(200)
}
