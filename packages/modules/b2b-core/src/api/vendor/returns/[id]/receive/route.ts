import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { beginReceiveReturnWorkflow } from '@medusajs/medusa/core-flows'

import { VendorReceiveReturnSchemaType } from '../../validators'

/**
 * @oas [post] /vendor/returns/{id}/receive
 * operationId: VendorReturnReceiveById
 * summary: Start Return Receival
 * description: Start a return receival process to be later confirmed.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The return's ID.
 *     required: true
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     description: Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default
 *       fields. without prefix it will replace the entire default fields.
 *     required: false
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorReceiveReturn"
 * tags:
 *   - Vendor Returns
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
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorReceiveReturnSchemaType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await beginReceiveReturnWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      return_id: id
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
