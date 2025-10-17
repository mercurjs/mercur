import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerOrderLink from '../../../links/seller-order'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { getVendorOrdersListWorkflow } from '../../../workflows/order/workflows'
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
 *   - name: created_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by created at date range
 *   - name: status
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *         - type: object
 *     required: false
 *     description: Filter by order status
 *   - name: fulfillment_status
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by fulfillment status
 *   - name: payment_status
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by payment status
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search query for filtering orders
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
 *   - Vendor Orders
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetOrderParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { data: orderRelations } = await query.graph({
    entity: sellerOrderLink.entryPoint,
    fields: ['order_id'],
    filters: {
      seller_id: seller.id,
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
