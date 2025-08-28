import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { getApplicableAttributes } from '../../../../../shared/infra/http/utils/products'

/**
 * @oas [get] /admin/products/{id}/applicable-attributes
 * operationId: "AdminGetProductApplicableAttributes"
 * summary: "Get Product Applicable Attributes"
 * description: "Retrieves all attributes that can be applied to a specific product, including global attributes and category-specific attributes."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the product to get applicable attributes for.
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
 *             attributes:
 *               type: array
 *               description: Array of attributes that can be applied to the product, including global attributes and category-specific attributes.
 *               items:
 *                 $ref: "#/components/schemas/Attribute"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Product not found"
 * tags:
 *   - Admin Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const attributes = await getApplicableAttributes(
    req.scope,
    req.params.id,
    req.queryConfig.fields
  )

  res.json({ attributes })
}
