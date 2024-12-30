import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { OrderDTO } from '@medusajs/framework/types'
import { getOrdersListWorkflow } from '@medusajs/medusa/core-flows'

/**
 * @oas [get] /vendor/orders/{id}
 * operationId: "VendorGetOrder"
 * summary: "Get Order details"
 * description: "Retrieves the details of specified order."
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
 *             order:
 *               $ref: "#/components/schemas/VendorOrderDetails"
 * tags:
 *   - Order
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await getOrdersListWorkflow(req.scope).run({
    input: {
      fields: req.remoteQueryConfig.fields,
      variables: {
        filters: {
          id
        }
      }
    }
  })

  const [order] = result as OrderDTO[]

  res.json({ order })
}
