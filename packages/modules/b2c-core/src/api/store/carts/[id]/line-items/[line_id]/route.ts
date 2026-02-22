import { MedusaRequest } from '@medusajs/framework'
import { MedusaResponse } from '@medusajs/framework/http'

import { deleteSellerLineItemWorkflow } from '../../../../../../workflows/cart/workflows'

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const id = req.params.line_id

  await deleteSellerLineItemWorkflow(req.scope).run({
    input: { cart_id: req.params.id, id }
  })

  res.status(200).json({
    id,
    object: 'line-item',
    deleted: true
  })
}
