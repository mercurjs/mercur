import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { getFormattedOrderSetListWorkflow } from '../../../workflows/order-set/workflows'
import { defaultStoreRetrieveOrderSetFields } from './query-config'

/**
 * @oas [get] /store/order-set
 * operationId: "StoreListOrderSets"
 * summary: "List Order Sets"
 * description: "Retrieves a list of order sets for the authenticated customer."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *       default: 0
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *       default: 50
 *     required: false
 *     description: The number of items to return.
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
 *             order_sets:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/StoreOrderSet"
 *             count:
 *               type: integer
 *               description: The total number of order sets available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 *   "401":
 *     description: Unauthorized
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Unauthorized"
 *   "403":
 *     description: Forbidden
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Forbidden"
 * tags:
 *   - Store
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: order_set_ids, metadata } = await query.graph({
    entity: 'order_set',
    fields: ['id'],
    filters: {
      customer_id: req.auth_context.actor_id
    },
    pagination: req.queryConfig.pagination
  })

  const {
    result: { data: order_sets }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: {
      filters: { id: order_set_ids.map((set) => set.id) },
      fields: defaultStoreRetrieveOrderSetFields
    }
  })

  res.json({
    order_sets,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
