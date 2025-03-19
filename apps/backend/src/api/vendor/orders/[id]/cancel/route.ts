import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { cancelOrderWorkflow } from '@medusajs/medusa/core-flows'

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
 *   - Order
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await cancelOrderWorkflow(req.scope).run({
    input: {
      order_id: id,
      canceled_by: req.auth_context.actor_id
    }
  })

  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  res.json({ order })
}
