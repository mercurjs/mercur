import sellerOrderLink from '#/links/seller-order'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { VendorGetOrderParamsType } from './validators'

/**
 * @oas [get] /vendor/orders
 * operationId: "VendorListOrders"
 * summary: "List Orders"
 * description: "Retrieves a list of orders for the authenticated vendor."
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
 *   - name: order
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: The order of the returned items.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             orders:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorOrderDetails"
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
 *   - Order
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<VendorGetOrderParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orderRelations, metadata } = await query.graph({
    entity: sellerOrderLink.entryPoint,
    fields: req.remoteQueryConfig.fields.map((field) => `order.${field}`),
    filters: req.filterableFields,
    pagination: {
      ...req.remoteQueryConfig.pagination
    }
  })

  res.json({
    orders: orderRelations.map((relation) => relation.order),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
