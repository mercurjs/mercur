import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createProductOptionsWorkflow } from '@medusajs/medusa/core-flows'

import { CreateProductOptionType } from '../../validators'

/**
 * @oas [post] /vendor/products/{id}/options
 * operationId: "VendorCreateOptionForProductById"
 * summary: "Create option for product"
 * description: "Creates option for product."
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
 *         $ref: "#/components/schemas/CreateProductOption"
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
  req: AuthenticatedMedusaRequest<CreateProductOptionType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  await createProductOptionsWorkflow(req.scope).run({
    input: {
      product_options: [
        {
          ...req.validatedBody,
          product_id: productId
        }
      ]
    }
  })

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

  res.json({ product })
}
