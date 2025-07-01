import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  deleteProductsWorkflow,
  updateProductsWorkflow
} from '@medusajs/medusa/core-flows'

import { getAvgRating } from '@mercurjs/reviews'

import {
  VendorGetProductParamsType,
  VendorUpdateProductType
} from '../validators'

/**
 * @oas [get] /vendor/products/{id}
 * operationId: "VendorGetProductById"
 * summary: "Get a Product"
 * description: "Retrieves a product by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
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
 *             product:
 *               $ref: "#/components/schemas/VendorProduct"
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<VendorGetProductParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product]
  } = await query.graph(
    {
      entity: 'product',
      fields: req.queryConfig.fields,
      filters: { id: req.params.id }
    },
    { throwIfKeyNotFound: true }
  )

  const rating = await getAvgRating(req.scope, 'product', req.params.id)

  res.json({ product: { ...product, rating } })
}

/**
 * @oas [post] /vendor/products/{id}
 * operationId: "VendorUpdateProductById"
 * summary: "Update a Product"
 * description: "Updates an existing product for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
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
 *         $ref: "#/components/schemas/VendorUpdateProduct"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product:
 *               $ref: "#/components/schemas/VendorProduct"
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...update } = req.validatedBody

  const { result } = await updateProductsWorkflow(req.scope).run({
    input: {
      // @ts-expect-error: updateProductsWorkflow does not support null values
      update,
      selector: { id: req.params.id },
      additional_data
    }
  })

  const {
    data: [product]
  } = await query.graph(
    {
      entity: 'product',
      fields: req.queryConfig.fields,
      filters: { id: result[0].id }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ product })
}

/**
 * @oas [delete] /vendor/products/{id}
 * operationId: "VendorDeleteProductById"
 * summary: "Delete a Product"
 * description: "Deletes a product by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the deleted Product
 *             object:
 *               type: string
 *               description: The type of the object that was deleted
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  await deleteProductsWorkflow(req.scope).run({
    input: {
      ids: [id]
    }
  })

  res.json({ id, object: 'product', deleted: true })
}
