import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /vendor/price-preferences
 * operationId: "VendorListPricePreferences"
 * summary: "List Price Preferences"
 * description: "Retrieves a list of price preferences for the authenticated vendor."
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
 *       default: 300
 *     required: false
 *     description: The number of items to return.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search term to filter price preferences.
 *   - name: id
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter by price preference ID(s).
 *   - name: attribute
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter by attribute name(s).
 *   - name: value
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter by attribute value(s).
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             price_preferences:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorPricePreference"
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
 *   - Vendor Price Preferences
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: price_preferences, metadata } = await query.graph({
    entity: 'price_preference',
    fields: req.queryConfig.fields,
    pagination: req.queryConfig.pagination,
    filters: req.filterableFields
  })

  res.json({
    price_preferences,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
