import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import categoryAttribute from '../../../../../links/category-attribute'

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
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product]
  } = await query.graph({
    entity: 'product',
    fields: ['categories.id'],
    filters: {
      id: req.params.id
    }
  })
  const categoryIds = product.categories.map((category) => category.id)

  const { data: attributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: ['attribute_id']
  })
  const attributeIds = attributes.map((attribute) => attribute.attribute_id)

  const { data: globalAttributes } = await query.graph({
    entity: 'attribute',
    fields: req.queryConfig.fields,
    filters: {
      id: {
        $nin: attributeIds
      }
    }
  })

  const { data: categoryAttributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: req.queryConfig.fields.map((field) => `attribute.${field}`),
    filters: {
      product_category_id: categoryIds
    }
  })

  res.json({
    attributes: [
      ...globalAttributes,
      ...categoryAttributes.map((rel) => rel.attribute)
    ]
  })
}
