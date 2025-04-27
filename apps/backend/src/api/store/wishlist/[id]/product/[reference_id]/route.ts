import { deleteWishlistWorkflow } from '#/workflows/wishlist/workflows'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteWishlistWorkflow.run({
    container: req.scope,
    input: req.params
  })

  res.json({
    ...req.params,
    object: 'wishlist',
    deleted: true
  })
}
