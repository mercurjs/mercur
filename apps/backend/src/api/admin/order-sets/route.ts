import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import orderSetOrder from '../../../links/order-set-order'
import { getFormattedOrderSetListWorkflow } from '../../../workflows/order-set/workflows'

/**
 * @oas [get] /admin/order-sets
 * operationId: "AdminListOrderSets"
 * summary: "List Order Sets"
 * description: "Retrieves a list of order sets with optional filtering."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to return.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 *   - name: order_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter order sets by a specific order ID.
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
 *                 $ref: "#/components/schemas/AdminOrderSet"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 * tags:
 *   - Admin Order Sets
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { filterableFields, queryConfig } = req

  if (filterableFields['order_id']) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [order_set]
    } = await query.graph({
      entity: orderSetOrder.entryPoint,
      fields: ['order_set_id'],
      filters: {
        order_id: req.filterableFields['order_id']
      }
    })

    delete filterableFields['order_id']
    filterableFields['id'] = order_set.order_set_id
  }

  const {
    result: { data, metadata }
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: {
      fields: queryConfig.fields,
      filters: filterableFields,
      pagination: queryConfig.pagination
    }
  })

  res.json({
    order_sets: data,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
