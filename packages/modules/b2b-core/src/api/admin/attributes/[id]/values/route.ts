import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { createAttributePossibleValuesWorkflow } from '../../../../../workflows/attribute/workflows'
import {
  AdminCreateAttributeValueType,
  AdminGetAttributeValuesParamsType
} from '../../validators'

/**
 * @oas [get] /admin/attributes/{id}/values
 * operationId: "AdminListAttributeValues"
 * summary: "List Attribute Values"
 * description: "Retrieves a list of possible values for a specific attribute."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the attribute.
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
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             attribute_possible_values:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/AttributePossibleValue"
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
  req: MedusaRequest<AdminGetAttributeValuesParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: attribute_possible_values, metadata } = await query.graph({
    entity: 'attribute_possible_value',
    filters: {
      attribute_id: req.params.id
    },
    ...req.queryConfig
  })

  res.status(200).json({
    attribute_possible_values,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

/**
 * @oas [post] /admin/attributes/{id}/values
 * operationId: "AdminCreateAttributeValue"
 * summary: "Create Attribute Value"
 * description: "Creates a new possible value for a specific attribute."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the attribute.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - value
 *           - rank
 *         properties:
 *           value:
 *             type: string
 *             minLength: 1
 *             description: The value of the possible value.
 *           rank:
 *             type: number
 *             description: The rank/order of the possible value.
 *           metadata:
 *             type: object
 *             description: Additional metadata for the possible value.
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             attribute_possible_value:
 *               $ref: "#/components/schemas/AttributePossibleValue"
 * tags:
 *   - Admin Attributes
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: MedusaRequest<AdminCreateAttributeValueType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const attributeId = req.params.id

  const {
    result: [createdAttributeValue]
  } = await createAttributePossibleValuesWorkflow(req.scope).run({
    input: [
      {
        ...req.validatedBody,
        attribute_id: attributeId
      }
    ]
  })

  const {
    data: [attribute_possible_value]
  } = await query.graph({
    entity: 'attribute_possible_value',
    filters: {
      id: createdAttributeValue.id
    },
    ...req.queryConfig
  })

  return res.status(201).json({ attribute_possible_value })
}
