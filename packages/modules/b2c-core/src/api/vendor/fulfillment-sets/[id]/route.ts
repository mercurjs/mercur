import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import { deleteFulfillmentSetsWorkflow } from '@medusajs/medusa/core-flows'

import { IntermediateEvents } from '@mercurjs/framework'

/**
 * @oas [delete] /vendor/fulfillment-sets/{id}
 * operationId: "VendorDeleteFulfillmentSet"
 * summary: "Delete a Fulfillment Set"
 * description: "Deletes a Fulfillment Set."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Fulfillment Set.
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
 *               description: The ID of the deleted Fulfillment Set.
 *             object:
 *               type: string
 *               description: The type of the object that was deleted.
 *               default: fulfillment_set
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted.
 *               default: true
 * tags:
 *   - Vendor Fulfillment Sets
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteFulfillmentSetsWorkflow(req.scope).run({
    input: {
      ids: [req.params.id]
    }
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: IntermediateEvents.FULFULLMENT_SET_CHANGED,
    data: { id: req.params.id }
  })

  res.json({
    id: req.params.id,
    object: 'fulfillment_set',
    deleted: true
  })
}
