import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { listSellerShippingOptionsForCartWorkflow } from '../../../workflows/cart/workflows'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { cart_id, is_return } = req.filterableFields as {
    cart_id: string
    is_return: boolean
  }

  const { result: shipping_options } =
    await listSellerShippingOptionsForCartWorkflow.run({
      container: req.scope,
      input: { cart_id, is_return: !!is_return }
    })

  res.json({ shipping_options })
}
