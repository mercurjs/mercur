import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /vendor/attributes
 * operationId: "VendorListAttributes"
 * summary: "List Attributes"
 * description: "Retrieves a list of attributes available to vendors with optional filtering."
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
 *   - name: id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by attribute ID.
 *   - name: name
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by attribute name.
 *   - name: handle
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by attribute handle.
 *   - name: ui_component
 *     in: query
 *     schema:
 *       type: string
 *       enum: [select, multivalue, unit, toggle, text_area, color_picker]
 *     required: false
 *     description: Filter by UI component type.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             attributes:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorAttribute"
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
 *   - Vendor Attributes
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: attributes, metadata } = await query.graph({
    entity: 'attribute',
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    attributes,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
