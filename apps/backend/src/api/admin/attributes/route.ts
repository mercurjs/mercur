import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import categoryAttribute from '../../../links/category-attribute'
import { createAttributesWorkflow } from '../../../workflows/attribute/workflows'
import {
  AdminCreateAttributeType,
  AdminGetAttributesParamsType
} from './validators'

/**
 * @oas [get] /admin/attributes
 * operationId: "AdminListAttributes"
 * summary: "List Attributes"
 * description: "Retrieves a list of attributes with optional filtering."
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
 *   - name: id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by attribute ID.
 *   - name: name
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by attribute name.
 *   - name: handle
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by attribute handle.
 *   - name: is_global
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter for global attributes (not assigned to any category).
 *   - name: ui_component
 *     in: query
 *     schema:
 *       type: string
 *       enum: [select, multivalue, unit, toggle, text_area, color_picker]
 *     required: false
 *     description: Filter by UI component type.
 *   - name: created_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by creation date using operators.
 *   - name: updated_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by update date using operators.
 *   - name: deleted_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by deletion date using operators.
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
 *               items:
 *                 $ref: "#/components/schemas/Attribute"
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
 *   - Admin Attributes
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<AdminGetAttributesParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { is_global, ...filterableFields } = req.filterableFields

  if (is_global) {
    const { data: attributes } = await query.graph({
      entity: categoryAttribute.entryPoint,
      fields: ['attribute_id']
    })
    const attributeIds = attributes.map((attribute) => attribute.attribute_id)
    filterableFields['id'] = {
      $nin: attributeIds
    }
  }

  const { data: attributes, metadata } = await query.graph({
    entity: 'attribute',
    filters: filterableFields,
    ...req.queryConfig
  })

  return res.json({
    attributes,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

/**
 * @oas [post] /admin/attributes
 * operationId: "AdminCreateAttribute"
 * summary: "Create Attribute"
 * description: "Creates a new attribute with the specified properties."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - name
 *         properties:
 *           name:
 *             type: string
 *             minLength: 1
 *             description: The name of the attribute.
 *           description:
 *             type: string
 *             description: A description of the attribute.
 *           handle:
 *             type: string
 *             description: A unique handle for the attribute.
 *           is_filterable:
 *             type: boolean
 *             description: Whether the attribute can be used for filtering products.
 *           is_required:
 *             type: boolean
 *             description: Whether the attribute is required for products.
 *           ui_component:
 *             type: string
 *             enum: [select, multivalue, unit, toggle, text_area, color_picker]
 *             default: select
 *             description: The UI component type for this attribute.
 *           metadata:
 *             type: object
 *             description: Additional metadata for the attribute.
 *           possible_values:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - value
 *                 - rank
 *               properties:
 *                 value:
 *                   type: string
 *                   minLength: 1
 *                   description: The value of the possible value.
 *                 rank:
 *                   type: number
 *                   description: The rank/order of the possible value.
 *                 metadata:
 *                   type: object
 *                   description: Additional metadata for the possible value.
 *             description: Array of possible values for the attribute (required when ui_component is 'select').
 *           product_category_ids:
 *             type: array
 *             items:
 *               type: string
 *             description: Array of product category IDs to associate with this attribute.
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             attribute:
 *               $ref: "#/components/schemas/Attribute"
 *   "400":
 *     description: Bad Request
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Possible values are required when ui_component is SELECT"
 * tags:
 *   - Admin Attributes
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: MedusaRequest<AdminCreateAttributeType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { result } = await createAttributesWorkflow(req.scope).run({
    input: { attributes: [req.validatedBody] }
  })

  const {
    data: [attribute]
  } = await query.graph({
    entity: 'attribute',
    filters: {
      id: result[0].id
    },
    ...req.queryConfig
  })

  res.status(201).json({ attribute })
}
