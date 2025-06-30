import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import {
  deleteProductVariantsWorkflow,
  updateProductVariantsWorkflow
} from '@medusajs/medusa/core-flows'

import { UpdateProductVariantType } from '../../../validators'

/**
 * @oas [delete] /vendor/products/{id}/variants/{variant_id}
 * operationId: "VendorDeleteProductVariantById"
 * summary: "Delete a Product variant"
 * description: "Deletes a product variant by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: variant_id
 *     required: true
 *     description: The ID of the Variant.
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
 *               description: The ID of the deleted Product variant
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
  const productId = req.params.id
  const variantId = req.params.variant_id

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [variant]
  } = await query.graph({
    entity: 'product_variant',
    fields: ['product_id'],
    filters: {
      id: variantId
    }
  })

  if (productId !== variant.product_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Invalid product variant id!'
    )
  }

  await deleteProductVariantsWorkflow(req.scope).run({
    input: { ids: [variantId] }
  })

  res.json({
    id: variantId,
    object: 'variant',
    deleted: true
  })
}

/**
 * @oas [post] /vendor/products/{id}/variants/{variant_id}
 * operationId: "VendorUpdateProductVariantById"
 * summary: "Update a Product variant"
 * description: "Updates an existing product variant for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: variant_id
 *     required: true
 *     description: The ID of the Variant.
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
 *         $ref: "#/components/schemas/UpdateProductVariant"
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
  req: AuthenticatedMedusaRequest<UpdateProductVariantType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const variantId = req.params.variant_id

  await updateProductVariantsWorkflow.run({
    container: req.scope,
    input: {
      update: req.validatedBody,
      selector: { id: variantId, product_id: productId }
    }
  })

  const {
    data: [product]
  } = await query.graph(
    {
      entity: 'product',
      fields: req.queryConfig.fields,
      filters: { id: productId }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ product })
}
