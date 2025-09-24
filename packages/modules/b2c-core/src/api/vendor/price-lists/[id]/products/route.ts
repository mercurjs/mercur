import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { fetchPriceListPriceIdsForProduct } from '@medusajs/medusa/api/admin/price-lists/helpers'

import { batchVendorPriceListPricesWorkflow } from '../../../../../workflows/price-list/workflows'
import { VendorUpdateProductsOnPriceListType } from '../../validators'

/**
 * @oas [get] /vendor/price-lists/{id}/products
 * operationId: "VendorListProductsInPriceList"
 * summary: "List Products in a given price list"
 * description: "Retrieves a list of products in the given price list."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the price list.
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
 * tags:
 *   - Vendor Price Lists
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { id } = req.params
  const {
    data: [priceList]
  } = await query.graph({
    entity: 'price_list',
    fields: ['prices.price_set.variant.id'],
    filters: {
      id
    }
  })

  const variantIds: string[] = []

  priceList.prices?.forEach((price) => {
    const variantId = price.price_set?.variant?.id

    if (variantId) {
      variantIds.push(variantId)
    }
  })

  const { data: products, metadata } = await query.graph({
    entity: 'product',
    fields: req.queryConfig.fields,
    filters: {
      variants: {
        id: variantIds
      }
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    products,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

/**
 * @oas [post] /vendor/price-lists/{id}/products
 * operationId: "VendorRemoveProductsFromPriceList"
 * summary: "Update price list"
 * description: "Updates price list price"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the price list.
 *     schema:
 *       type: string
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
 *         $ref: "#/components/schemas/VendorRemoveProductsFromPriceList"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             price_list:
 *               $ref: "#/components/schemas/VendorPriceList"
 * tags:
 *   - Vendor Price Lists
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductsOnPriceListType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params
  const { remove = [], create = [], update = [] } = req.validatedBody

  const productPriceIds = await fetchPriceListPriceIdsForProduct(
    id,
    remove,
    req.scope
  )

  await batchVendorPriceListPricesWorkflow.run({
    container: req.scope,
    input: {
      id,
      create,
      update,
      delete: productPriceIds
    }
  })

  const {
    data: [price_list]
  } = await query.graph({
    entity: 'price_list',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ price_list })
}
