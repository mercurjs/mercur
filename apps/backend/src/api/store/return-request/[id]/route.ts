import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { storeReturnOrderRequestFields } from '../query-config'

/**
 * @oas [get] /store/return-request/{id}
 * operationId: "StoreGetOrderReturnRequestById"
 * summary: "Get return request by id"
 * description: "Retrieves a request by id for the authenticated customer."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Request.
 *     schema:
 *       type: string
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
 *             orderReturnRequest:
 *               $ref: "#/components/schemas/OrderReturnRequest"
 * tags:
 *   - Store Return Request
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order_return_request]
  } = await query.graph({
    entity: 'order_return_request',
    fields: storeReturnOrderRequestFields,
    filters: {
      id: req.params.id,
      customer_id: req.auth_context.actor_id
    }
  })

  res.json({ order_return_request })
}
