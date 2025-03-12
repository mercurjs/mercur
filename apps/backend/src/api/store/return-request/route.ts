import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerOrder from '../../../links/seller-order'
import { createOrderReturnRequestWorkflow } from '../../../workflows/order-return-request/workflows'
import { StoreCreateReturnRequestType } from './validators'

/**
 * @oas [get] /store/return-request
 * operationId: "StoreListOrderReturnRequests"
 * summary: "List return requests"
 * description: "Retrieves requests list"
 * x-authenticated: true
 * parameters:
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
 *             order_return_request:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/OrderReturnRequest"
 *             count:
 *               type: integer
 *               description: The total number of requests
 *             offset:
 *               type: integer
 *               description: The number of requests skipped
 *             limit:
 *               type: integer
 *               description: The number of requests per page
 * tags:
 *   - OrderReturnRequest
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: order_return_requests, metadata } = await query.graph({
    entity: 'order_return_request',
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      customer_id: req.auth_context.actor_id
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    order_return_requests,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

/**
 * @oas [post] /store/return-request
 * operationId: "StoreCreateOrderReturnRequest"
 * summary: "Create an order return request"
 * description: "Creates a new order return request for the authenticated customer."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/StoreCreateOrderReturnRequest"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             invite:
 *               $ref: "#/components/schemas/OrderReturnRequest"
 * tags:
 *   - OrderReturnRequest
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: AuthenticatedMedusaRequest<StoreCreateReturnRequestType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [resource]
  } = await query.graph({
    entity: sellerOrder.entryPoint,
    fields: ['seller_id'],
    filters: {
      order_id: req.validatedBody.order_id
    }
  })

  const { result: order_return_request } =
    await createOrderReturnRequestWorkflow.run({
      input: {
        data: { ...req.validatedBody, customer_id: req.auth_context.actor_id },
        seller_id: resource.seller_id
      }
    })

  res.json({ order_return_request })
}
