import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { completeOrderWorkflow } from '@medusajs/medusa/core-flows'

import { getVendorOrdersListWorkflow } from '../../../../../workflows/order/workflows'

/**
 * @oas [post] /vendor/orders/{id}/complete
 * operationId: "VendorCompleteOrder"
 * summary: "Mark order as complete"
 * description: "Mark order as complete."
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

  await completeOrderWorkflow(req.scope).run({
    input: {
      orderIds: [id]
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
