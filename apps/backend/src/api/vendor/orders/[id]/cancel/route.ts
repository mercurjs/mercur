import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { getVendorOrdersListWorkflow } from '../../../../../workflows/order/workflows'
import { cancelOrderWorkflow } from '../../../../../workflows/order/workflows/cancel-order'

/**
 * @oas [post] /vendor/orders/{id}/cancel
 * operationId: "VendorCancelOrder"
 * summary: "Mark order as cancelled"
 * description: "Mark order as cancelled."
 * x-authenticated: true
 * parameters:
 * - in: path
 *   name: id
 *   required: true
 *   description: The ID of the Order.
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
  const { id } = req.params

  await cancelOrderWorkflow(req.scope).run({
    input: {
      order_id: id,
      canceled_by: req.auth_context.actor_id
    }
  })

  const {
    result: [order]
  } = await getVendorOrdersListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      variables: {
        filters: {
          id
        }
      }
    }
  })

  res.json({ order })
}
