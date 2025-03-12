import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntities
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createProductTagsWorkflow } from '@medusajs/medusa/core-flows'

import { VendorCreateProductTagType } from './validators'

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
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { rows: product_tags, metadata } = await refetchEntities(
    'product_tag',
    req.filterableFields,
    req.scope,
    req.queryConfig.fields,
    req.queryConfig.pagination
  )

  res.json({
    product_tags,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

/**
 * @oas [post] /vendor/product-tags
 * operationId: "VendorCreateProductTag"
 * summary: "Create product tag"
 * description: "Creates new product tag"
 * x-authenticated: true
 * parameters:
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateProductTag"
 * responses:
 *   "201":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product_tag:
 *               $ref: "#/components/schemas/VendorProductTag"
 * tags:
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateProductTagType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createProductTagsWorkflow.run({
    container: req.scope,
    input: { product_tags: [req.validatedBody] }
  })

  const {
    data: [product_tag]
  } = await query.graph({
    entity: 'product_tag',
    fields: req.queryConfig.fields,
    filters: {
      id: result[0].id
    }
  })

  res.status(201).json({ product_tag })
}
