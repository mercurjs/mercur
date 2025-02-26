import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'

import sellerProductLink from '../../../links/seller-product'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { assignBrandToProductWorkflow } from '../../../workflows/brand/workflows'
import {
  VendorCreateProductType,
  VendorGetProductParamsType
} from './validators'

/**
 * @oas [get] /vendor/products
 * operationId: "VendorListProducts"
 * summary: "List Products"
 * description: "Retrieves a list of products for the authenticated vendor."
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
 *   - name: order
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: The order of the returned items.
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
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<VendorGetProductParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerProducts, metadata } = await query.graph({
    entity: sellerProductLink.entryPoint,
    fields: req.remoteQueryConfig.fields.map((field) => `product.${field}`),
    filters: req.filterableFields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    products: sellerProducts.map((product) => product.product),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

/**
 * @oas [post] /vendor/products
 * operationId: "VendorCreateProduct"
 * summary: "Create a Product"
 * description: "Creates a new product for the authenticated vendor."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateProduct"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product:
 *               $ref: "#/components/schemas/VendorProduct"
 * tags:
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateProductType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context?.actor_id,
    req.scope
  )

  const brand_name = req.validatedBody.brand_name
  delete req.validatedBody['brand_name']

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          ...req.validatedBody
        }
      ],
      additional_data: {
        seller_id: seller.id
      }
    }
  })

  if (brand_name) {
    await assignBrandToProductWorkflow.run({
      container: req.scope,
      input: {
        brand_name,
        product_id: result[0].id
      }
    })
  }

  const {
    data: [product]
  } = await query.graph(
    {
      entity: 'product',
      fields: req.remoteQueryConfig.fields,
      filters: { id: result[0].id }
    },
    { throwIfKeyNotFound: true }
  )

  res.status(201).json({ product })
}
