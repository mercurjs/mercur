import { createOrderShipmentWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { VendorOrderCreateShipmentType } from '../../../../validators'

/**
 * @oas [post] /vendor/orders/{id}/fulfillments/{fulfillment_id}/shipments
 * operationId: "VendorUpdateOrderFulfillmentShipment"
 * summary: "Update order fulfillment shipment."
 * description: "Update order fulfillment shipment."
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
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorOrderCreateShipment"
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
  req: AuthenticatedMedusaRequest<VendorOrderCreateShipmentType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await createOrderShipmentWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      order_id: req.params.id,
      fulfillment_id: req.params.fulfillment_id,
      labels: req.validatedBody.labels ?? []
    }
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
