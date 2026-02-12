import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { filterSellerProductsByCollection } from '../../utils'
import { batchLinkProductsToCollectionWorkflow } from "@medusajs/core-flows"
import { LinkMethodRequest } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { productIds, count } = await filterSellerProductsByCollection(
    req.scope,
    req.params.id,
    req.filterableFields.seller_id as string,
    req.queryConfig.pagination?.skip || 0,
    req.queryConfig.pagination?.take || 10
  )

  const { data: products } = await query.graph({
    entity: 'product',
    fields: req.queryConfig.fields,
    filters: {
      id: productIds
    }
  })

  res.json({
    products,
    count,
    offset: req.queryConfig.pagination?.skip || 0,
    limit: req.queryConfig.pagination?.take || 10
  })
}

/**
 * @oas [post] /vendor/product-collections/{id}/products
 * summary: Manage Vendor Products of a Collection
 * x-sidebar-summary: Manage Vendor Products of a Collection
 * description: Manage the vendor products of a collection by adding or removing them from the collection.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The collection's ID.
 *     required: true
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     description: Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default
 *       fields. without prefix it will replace the entire default fields.
 *     required: false
 *     schema:
 *       type: string
 *       title: fields
 *       description: Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default
 *         fields. without prefix it will replace the entire default fields.
 *       externalDocs:
 *         url: "#select-fields-and-relations"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         description: The products to add or remove.
 *         properties:
 *           add:
 *             type: array
 *             description: The products to add to the collection.
 *             items:
 *               type: string
 *               title: add
 *               description: A product's ID.
 *           remove:
 *             type: array
 *             description: The products to remove from the collection.
 *             items:
 *               type: string
 *               title: remove
 *               description: A product's ID.
 * tags:
 *   - Vendor Product Collections
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorProduct"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 * x-workflow: batchLinkProductsToCollectionWorkflow
 * x-events: []
 * 
*/

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse
) => {
  const id = req.params.id
  const { add = [], remove = [] } = req.validatedBody
  
  const workflow = batchLinkProductsToCollectionWorkflow(req.scope)
  await workflow.run({
    input: {
      id,
      add,
      remove,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { productIds, count } = await filterSellerProductsByCollection(
    req.scope,
    req.params.id,
    req.filterableFields.seller_id as string,
    req.queryConfig.pagination?.skip || 0,
    req.queryConfig.pagination?.take || 10
  )

  const { data: products } = await query.graph({
    entity: 'product',
    fields: req.queryConfig.fields,
    filters: {
      id: productIds
    }
  })

  res.status(200).json({
    products,
    count,
    offset: req.queryConfig.pagination?.skip || 0,
    limit: req.queryConfig.pagination?.take || 10
  })
}
