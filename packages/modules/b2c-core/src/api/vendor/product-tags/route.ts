import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { HttpTypes } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /vendor/product-tags
 * operationId: "VendorListProductTags"
 * summary: "List product tags"
 * description: "Retrieves a list of product tags."
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
 *             product_tags:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorProductTag"
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
 *   - Vendor Product Tags
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.PaginatedResponse<{ product_tags: HttpTypes.AdminProductTag[] }>>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: product_tags, metadata } = await query.graph({
    entity: 'product_tag',
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    product_tags,
    count: metadata?.count ?? product_tags.length,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? req.queryConfig.pagination?.take ?? 50
  })
}
