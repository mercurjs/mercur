import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { getOrdersListWorkflow } from '@medusajs/medusa/core-flows'

import { selectCustomerOrders } from '@mercurjs/seller'

import { fetchSellerByAuthActorId } from '../../../../../shared/infra/http/utils'

/**
 * @oas [get] /vendor/customers/{id}/orders
 * operationId: "VendorListOrdersByCustomerId"
 * summary: "List Orders by customer id"
 * description: "Retrieves a list of orders for the specified customer."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the customer.
 *     schema:
 *       type: string
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
 *               items:
 *                 $ref: "#/components/schemas/VendorCustomerOrderOverview"
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
 *   - Vendor Customers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { orders: orderIds, count } = await selectCustomerOrders(
    req.scope,
    seller.id,
    req.params.id,
    {
      skip: req.queryConfig.pagination.skip,
      take: req.queryConfig.pagination.take || 50
    },
    ['id']
  )

  const { result: orders } = await getOrdersListWorkflow.run({
    container: req.scope,
    input: {
      fields: req.queryConfig.fields,
      variables: {
        filters: {
          id: orderIds.map((o) => o.id)
        }
      }
    }
  })

  res.json({
    orders,
    count,
    offset: req.queryConfig.pagination.skip,
    limit: req.queryConfig.pagination.take
  })
}
