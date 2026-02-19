import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { filterSellerProductIds } from './utils'

/**
 * @oas [get] /vendor/product-collections
 * operationId: "VendorListProductCollections"
 * summary: "List product collections"
 * description: "Retrieves a list of product collections."
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
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search term to filter collections by title or handle.
 *   - name: created_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by creation date using operators ($lt, $gt, $lte, $gte).
 *   - name: updated_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by update date using operators ($lt, $gt, $lte, $gte).
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product_collections:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorProductCollection"
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
 *   - Vendor Product Collections
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { seller_id, ...filterableFields } = req.filterableFields as Record<string, unknown>

  const { data: product_collections, metadata } = await query.graph({
    entity: 'product_collection',
    fields: req.queryConfig.fields,
    filters: filterableFields,
    pagination: req.queryConfig.pagination
  })

  const hasProducts = product_collections.some(
    (c) => Array.isArray((c as Record<string, unknown>).products)
  )

  if (hasProducts && seller_id) {
    const allProductIds = product_collections.flatMap((c) => {
      const products = (c as Record<string, unknown>).products as { id: string }[] | undefined
      return products?.map((p) => p.id) ?? []
    })

    const sellerProductIds = await filterSellerProductIds(
      req.scope,
      seller_id as string,
      allProductIds
    )

    for (const collection of product_collections) {
      const col = collection as Record<string, unknown>
      if (Array.isArray(col.products)) {
        col.products = (col.products as { id: string }[]).filter(
          (p) => sellerProductIds.has(p.id)
        )
      }
    }
  }

  res.json({
    product_collections,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
