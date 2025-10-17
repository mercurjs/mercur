import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerOrder from '../../../../../links/seller-order'
import { getVendorOrdersListWorkflow } from '../../../../../workflows/order/workflows'
import { AdminGetSellerOrdersParamsType } from '../../validators'

/**
 * @oas [get] /admin/sellers/{id}/orders
 * operationId: "AdminListSellerOrders"
 * summary: "List Seller Orders"
 * description: "Retrieves a list of orders associated with a specific seller."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the seller.
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
 *               description: Array of orders associated with the seller.
 *               items:
 *                 type: object
 *                 description: Order object with details.
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Seller not found"
 * tags:
 *   - Admin Sellers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<AdminGetSellerOrdersParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orderRelations } = await query.graph({
    entity: sellerOrder.entryPoint,
    fields: ['order_id'],
    filters: {
      seller_id: req.params.id,
      deleted_at: {
        $eq: null
      }
    }
  })

  const { result } = await getVendorOrdersListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      variables: {
        filters: {
          ...req.filterableFields,
          id: orderRelations.map((relation) => relation.order_id)
        },
        ...req.queryConfig.pagination
      }
    }
  })

  const { rows, metadata } = result as any

  res.json({
    orders: rows,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
