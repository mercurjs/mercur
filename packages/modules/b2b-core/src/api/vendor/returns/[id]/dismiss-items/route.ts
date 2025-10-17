import { dismissItemReturnRequestWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { VendorReceiveReturnItemsSchemaType } from '../../validators'

/**
 * @oas [post] /vendor/returns/{id}/dismiss-items
 * operationId: "VendorAddDismissReturnItemById"
 * summary: "Add Damaged Item to Return"
 * description: "Add damaged items, whose quantity is to be dismissed, to a return."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the return.
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
 *         $ref: "#/components/schemas/VendorReceiveReturnItems"
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
  req: AuthenticatedMedusaRequest<VendorReceiveReturnItemsSchemaType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await dismissItemReturnRequestWorkflow.run({
    container: req.scope,
    input: { ...req.validatedBody, return_id: id }
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
