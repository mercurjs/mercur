import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import { updateOrderReturnRequestWorkflow } from '../../../../workflows/order-return-request/workflows'
import { AdminUpdateOrderReturnRequestType } from '../validators'

/**
 * @oas [get] /admin/return-request/{id}
 * operationId: "AdminGetOrderReturnRequestById"
 * summary: "Get return request by id"
 * description: "Retrieves a request by id."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Request.
 *     schema:
 *       type: string
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
 *             orderReturnRequest:
 *               $ref: "#/components/schemas/OrderReturnRequest"
 * tags:
 *   - Admin Return Request
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
    data: [order_return_request]
  } = await query.graph({
    entity: 'order_return_request',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ order_return_request })
}

/**
 * @oas [post] /admin/return-request/{id}
 * operationId: "AdminUpdateOrderReturnRequestById"
 * summary: "Update return request by id"
 * description: "Updates a request by id."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Request.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminUpdateOrderReturnRequest"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             orderReturnRequest:
 *               $ref: "#/components/schemas/OrderReturnRequest"
 * tags:
 *   - Admin Return Request
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateOrderReturnRequestType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [request]
  } = await query.graph({
    entity: 'order_return_request',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
      status: 'escalated'
    }
  })

  if (!request) {
    throw new MedusaError(
      MedusaError.Types.INVALID_ARGUMENT,
      'Request is not in escalated state!'
    )
  }

  const { result: order_return_request } =
    await updateOrderReturnRequestWorkflow.run({
      input: {
        id: req.params.id,
        ...req.validatedBody,
        admin_reviewer_id: req.auth_context.actor_id,
        admin_review_date: new Date()
      },
      container: req.scope
    })

  res.json({ order_return_request })
}
