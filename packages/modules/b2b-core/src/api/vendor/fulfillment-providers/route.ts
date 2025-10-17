import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /vendor/fulfillment-providers
 * operationId: "VendorListFulfillmentProviders"
 * summary: "List Fulfillment Providers"
 * description: "Retrieves a list of Fulfillment Providers."
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
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
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             fulfillment_providers:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorFulfillmentSet"
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
 *   - Vendor Fulfillment Providers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: fulfillment_providers, metadata } = await query.graph({
    entity: 'fulfillment_provider',
    fields: req.queryConfig.fields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    fulfillment_providers,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
