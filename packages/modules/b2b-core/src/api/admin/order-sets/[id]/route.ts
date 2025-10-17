import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { getFormattedOrderSetListWorkflow } from '../../../../workflows/order-set/workflows'

/**
 * @oas [get] /admin/order-sets/{id}
 * operationId: "AdminGetOrderSet"
 * summary: "Get Order Set"
 * description: "Retrieves a specific order set by its ID."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the order set to retrieve.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             order_set:
 *               $ref: "#/components/schemas/AdminOrderSet"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Order set not found"
 * tags:
 *   - Admin Order Sets
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const {
    result: {
      data: [order_set]
    }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      filters: { id: req.params.id },
      pagination: req.queryConfig.pagination
    }
  })

  res.json({ order_set })
}
