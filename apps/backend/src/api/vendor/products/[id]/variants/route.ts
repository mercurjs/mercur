import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createProductVariantsWorkflow } from '@medusajs/medusa/core-flows'

import { CreateProductVariantType } from '../../validators'

/**
 * @oas [post] /vendor/products/{id}/variants
 * operationId: "VendorCreateVariantForProductById"
 * summary: "Create variant for product"
 * description: "Creates variant for product."
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
 *         $ref: "#/components/schemas/CreateProductVariant"
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
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<CreateProductVariantType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await createProductVariantsWorkflow.run({
    container: req.scope,
    input: {
      product_variants: [
        {
          ...req.validatedBody,
          product_id: req.params.id
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
