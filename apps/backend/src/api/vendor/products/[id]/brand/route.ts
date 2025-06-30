import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { assignBrandToProductWorkflow } from '../../../../../workflows/brand/workflows'
import { VendorAssignBrandNameType } from '../../validators'

/**
 * @oas [post] /vendor/products/{id}/brand
 * operationId: "VendorAssignBrandToProduct"
 * summary: "Assign brand to the Product"
 * description: "Upserts brand and links to the product"
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
 *         $ref: "#/components/schemas/VendorAssignBrandName"
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
  req: AuthenticatedMedusaRequest<VendorAssignBrandNameType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await assignBrandToProductWorkflow.run({
    container: req.scope,
    input: {
      brand_name: req.validatedBody.brand_name,
      product_id: id
    }
  })

  const {
    data: [product]
  } = await query.graph({
    entity: 'product',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  res.json({ product })
}
