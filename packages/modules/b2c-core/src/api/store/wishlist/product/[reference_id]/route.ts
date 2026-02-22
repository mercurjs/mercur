import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { deleteWishlistEntryWorkflow } from '../../../../../workflows/wishlist/workflows'
import { getWishlistFromCustomerId } from '../../../../../modules/wishlist/utils'
import { MedusaError } from '@medusajs/framework/utils'

/**
 * @oas [delete] /store/wishlist/product/{reference_id}
 * operationId: "StoreDeleteWishlist"
 * summary: "Delete a wishlist entry"
 * description: "Removes an item from the wishlist of the currently authenticated user. The wishlist is resolved from the logged-in customer."
 * x-authenticated: true
 * parameters:
 *   - name: reference_id
 *     in: path
 *     required: true
 *     description: ID of the product (wishlist entry) to remove.
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
 *             id:
 *               type: string
 *               description: Id of the wishlsit nad reference id.
 *             reference_id:
 *               type: string
 *             object:
 *              type: string
 *              description: The type of resource
 *             deleted:
 *               type: boolean
 *               description: Indicates if the wishlist entry was deleted.
 * tags:
 *   - Store Wishlist
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const wishlist = await getWishlistFromCustomerId(
    req.scope,
    req.auth_context.actor_id
  )

  if (!wishlist) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Wishlist not found for current customer')
  }

  await deleteWishlistEntryWorkflow.run({
    container: req.scope,
    input: {
      id: wishlist.id,
      reference_id: req.params.reference_id
    }
  })

  res.json({
    id: wishlist.id,
    reference_id: req.params.reference_id,
    object: 'wishlist',
    deleted: true
  })
}
