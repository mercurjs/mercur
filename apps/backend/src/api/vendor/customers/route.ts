import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { selectSellerCustomers } from '../../../modules/seller/utils'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'

/**
 * @oas [get] /vendor/customers
 * operationId: "VendorListSellerCustomers"
 * summary: "List Customers"
 * description: "Retrieves a list of customers who placed an order in sellers store."
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: limit
 *     schema:
 *       type: number
 *     description: The number of items to return. Default 50.
 *   - in: query
 *     name: offset
 *     schema:
 *       type: number
 *     description: The number of items to skip before starting the response. Default 0.
 *   - in: query
 *     name: fields
 *     schema:
 *       type: string
 *     description: Comma-separated fields that should be included in the returned data.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             customers:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorCustomer"
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
 *   - Seller
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

  const { customers, count } = await selectSellerCustomers(
    req.scope,
    seller.id,
    {
      skip: req.remoteQueryConfig.pagination.skip,
      take: req.remoteQueryConfig.pagination.take || 50
    },
    req.remoteQueryConfig.fields
  )

  res.json({
    customers,
    count: count,
    offset: req.remoteQueryConfig.pagination.skip,
    limit: req.remoteQueryConfig.pagination.take
  })
}
