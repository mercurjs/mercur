import { deleteWishlistWorkflow } from '#/workflows/wishlist/workflows'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

/**
 * @oas [delete] /store/wishlist/{id}/product/{reference_id}
 * operationId: "StoreDeleteWishlist"
 * summary: "Delete a wishlist entry"
 * description: "Deletes a wishlist entry by its ID for the authenticated user."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     description: The ID of the wishlist entry to delete.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             object:
 *               type: object
 *               description: Id of the wishlsit nad reference id.
 *             object:
 *               type: string
 *               description: The type of the object that was deleted.
 *               example: wishlist
 *             deleted:
 *               type: boolean
 *               description: Whether the wishlist entry was successfully deleted.
 *               example: true
 * tags:
 *   - Wishlist
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */

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
