import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  removeItemReceiveReturnActionWorkflow,
  updateReceiveItemReturnRequestWorkflow
} from '@medusajs/medusa/core-flows'

import { VendorReturnsReceiveItemsActionSchemaType } from '../../../validators'

/**
 * @oas [post] /vendor/returns/{id}/receive-items/{action_id}
 * operationId: "VendorUpdateReceiveReturnItemById"
 * summary: "Update received Item of Return"
 * description: "Update a received item."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the return.
 *     schema:
 *       type: string
 *   - name: action_id
 *     in: path
 *     description: The ID of the received item's `RECEIVE_RETURN_ITEM` action.
 *     required: true
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     description: Comma-separated fields that should be included in the returned data.
 *     required: false
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorReturnsReceiveItemsAction"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             return:
 *               $ref: "#/components/schemas/VendorReturn"
 * tags:
 *   - Vendor Returns
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorReturnsReceiveItemsActionSchemaType>,
  res: MedusaResponse
) => {
  const { id, action_id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateReceiveItemReturnRequestWorkflow.run({
    container: req.scope,
    input: {
      data: { ...req.validatedBody },
      return_id: id,
      action_id
    }
  })

  const { data: result } = await query.graph({
    entity: 'return',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    return: result
  })
}

/**
 * @oas [delete] /vendor/returns/{id}/receive-items/{action_id}
 * operationId: "VendorReceiveReturnItemById"
 * summary: "Remove received Item from Return"
 * description: "Remove a received item"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the return.
 *     schema:
 *       type: string
 *   - name: action_id
 *     in: path
 *     description: The ID of the received item's `RECEIVE_RETURN_ITEM` action.
 *     required: true
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     description: Comma-separated fields that should be included in the returned data.
 *     required: false
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             return:
 *               $ref: "#/components/schemas/VendorReturn"
 * tags:
 *   - Vendor Returns
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id, action_id } = req.params

  await removeItemReceiveReturnActionWorkflow.run({
    container: req.scope,
    input: {
      return_id: id,
      action_id
    }
  })

  const { data: result } = await query.graph({
    entity: 'return',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    return: result
  })
}
