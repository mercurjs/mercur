import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import {
  deleteProductOptionsWorkflow,
  updateProductOptionsWorkflow
} from '@medusajs/medusa/core-flows'

import { UpdateProductOptionType } from '../../../validators'

/**
 * @oas [delete] /vendor/products/{id}/options/{option_id}
 * operationId: "VendorDeleteProductOptionById"
 * summary: "Delete a Product option"
 * description: "Deletes a product option by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: option_id
 *     required: true
 *     description: The ID of the Option.
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
 *               description: The ID of the deleted Product option
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
  const optionId = req.params.option_id

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [option]
  } = await query.graph({
    entity: 'product_option',
    fields: ['product_id'],
    filters: {
      id: optionId
    }
  })

  if (productId !== option.product_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Invalid product option id!'
    )
  }

  await deleteProductOptionsWorkflow.run({
    container: req.scope,
    input: { ids: [optionId] }
  })

  res.json({
    id: optionId,
    object: 'option',
    deleted: true
  })
}

/**
 * @oas [post] /vendor/products/{id}/options/{option_id}
 * operationId: "VendorUpdateProductOptionById"
 * summary: "Update a Product option"
 * description: "Updates an existing product option for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: option_id
 *     required: true
 *     description: The ID of the Option.
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
 *         $ref: "#/components/schemas/UpdateProductOption"
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
  req: AuthenticatedMedusaRequest<UpdateProductOptionType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const optionId = req.params.option_id

  await updateProductOptionsWorkflow.run({
    container: req.scope,
    input: {
      selector: { id: optionId, product_id: productId },
      update: req.validatedBody
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
