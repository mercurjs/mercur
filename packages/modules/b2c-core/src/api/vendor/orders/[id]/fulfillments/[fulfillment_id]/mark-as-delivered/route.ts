import { markOrderFulfillmentAsDeliveredWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [post] /vendor/orders/{id}/fulfillments/{fulfillment_id}/mark-as-delivered
 * operationId: "VendorOrderFulfillmentMarkDelivered"
 * summary: "Mark order fulfillment shipment as delivered."
 * description: "Mark order fulfillment shipment as delivered."
 * x-authenticated: true
 * parameters:
 * - in: path
 *   name: id
 *   required: true
 *   description: The ID of the Order.
 *   schema:
 *     type: string
 * - in: path
 *   name: fulfillment_id
 *   required: true
 *   description: The ID of the fulfillment.
 *   schema:
 *     type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             member:
 *               $ref: "#/components/schemas/VendorOrderDetails"
 * tags:
 *   - Vendor Orders
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await markOrderFulfillmentAsDeliveredWorkflow.run({
    container: req.scope,
    input: { orderId: req.params.id, fulfillmentId: req.params.fulfillment_id }
  })

  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ order })
}
