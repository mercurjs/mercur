import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerReturnRequest from '../../../links/seller-return-request'

/**
 * @oas [get] /vendor/return-request
 * operationId: "VendorListOrderReturnRequests"
 * summary: "List return requests"
 * description: "Retrieves requests list"
 * x-authenticated: true
 * parameters:
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
 *             order_return_request:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/OrderReturnRequest"
 *             count:
 *               type: integer
 *               description: The total number of requests
 *             offset:
 *               type: integer
 *               description: The number of requests skipped
 *             limit:
 *               type: integer
 *               description: The number of requests per page
 * tags:
 *   - Vendor Return Requests
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orderReturnRequests, metadata } = await query.graph({
    entity: sellerReturnRequest.entryPoint,
    fields: req.queryConfig.fields.map(
      (field) => `order_return_request.${field}`
    ),
    filters: {
      ...req.filterableFields,
      deleted_at: {
        $eq: null
      }
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    order_return_request: orderReturnRequests.map(
      (rel) => rel.order_return_request
    ),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
