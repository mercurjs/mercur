import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { updateAttributePossibleValueWorkflow } from '../../../../../../workflows/attribute/workflows'
import {
  AdminGetAttributeValueParamsType,
  AdminUpdateAttributeValueType
} from '../../../validators'

/**
 * @oas [get] /admin/attributes/{id}/values/{value_id}
 * operationId: "AdminGetAttributeValue"
 * summary: "Get Attribute Value"
 * description: "Retrieves a specific attribute possible value by its ID."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the attribute.
 *   - name: value_id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the attribute possible value.
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
 *             attribute_possible_value:
 *               $ref: "#/components/schemas/AttributePossibleValue"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Attribute possible value not found"
 * tags:
 *   - Admin Attributes
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<AdminGetAttributeValueParamsType>,
  res: MedusaResponse
) => {
  const { value_id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [attribute_possible_value]
  } = await query.graph(
    {
      entity: 'attribute_possible_value',
      ...req.queryConfig,
      filters: {
        ...req.filterableFields,
        id: value_id
      }
    },
    { throwIfKeyNotFound: true }
  )

  return res.json({ attribute_possible_value })
}

/**
 * @oas [post] /admin/attributes/{id}/values/{value_id}
 * operationId: "AdminUpdateAttributeValue"
 * summary: "Update Attribute Value"
 * description: "Updates an existing attribute possible value with the specified properties."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the attribute.
 *   - name: value_id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the attribute possible value to update.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           value:
 *             type: string
 *             description: The value of the possible value.
 *           rank:
 *             type: number
 *             description: The rank/order of the possible value.
 *           metadata:
 *             type: object
 *             description: Additional metadata for the possible value.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             attribute_possible_value:
 *               $ref: "#/components/schemas/AttributePossibleValue"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Attribute possible value not found"
 * tags:
 *   - Admin Attributes
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: MedusaRequest<AdminUpdateAttributeValueType>,
  res: MedusaResponse
) => {
  const { value_id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateAttributePossibleValueWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      id: value_id
    }
  })

  const {
    data: [attribute_possible_value]
  } = await query.graph({
    entity: 'attribute_possible_value',
    ...req.queryConfig,
    filters: {
      ...req.filterableFields,
      id: value_id
    }
  })

  return res.json({ attribute_possible_value })
}
