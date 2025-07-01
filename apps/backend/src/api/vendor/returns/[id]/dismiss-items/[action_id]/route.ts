import {
  removeItemReturnActionWorkflow,
  updateReceiveItemReturnRequestWorkflow
} from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { VendorReturnsDismissItemsActionSchemaType } from '../../../validators'

/**
 * @oas [post] /vendor/returns/{id}/dismiss-items/{action_id}
 * operationId: "VendorUpdateDismissReturnItemById"
 * summary: "Update Damaged Item of Return"
 * description: "Update a damaged item, whose quantity is to be dismissed, in the return by the ID of the  item's `RECEIVE_DAMAGED_RETURN_ITEM` action."
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
 *     description: The ID of the damaged item's `RECEIVE_DAMAGED_RETURN_ITEM` action.
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
 *         $ref: "#/components/schemas/VendorReturnsDismissItemsAction"
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
  req: AuthenticatedMedusaRequest<VendorReturnsDismissItemsActionSchemaType>,
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

  const {
    data: [result]
  } = await query.graph({
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
 * @oas [delete] /vendor/returns/{id}/dismiss-items/{action_id}
 * operationId: "VendorDismissReturnItemById"
 * summary: "Remove Damaged Item from Return"
 * description: "Remove a damaged item, whose quantity is to be dismissed, in the return by the ID of the  item's `RECEIVE_DAMAGED_RETURN_ITEM` action."
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
 *     description: The ID of the damaged item's `RECEIVE_DAMAGED_RETURN_ITEM` action.
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

  await removeItemReturnActionWorkflow.run({
    container: req.scope,
    input: {
      return_id: id,
      action_id
    }
  })

  const {
    data: [result]
  } = await query.graph({
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
