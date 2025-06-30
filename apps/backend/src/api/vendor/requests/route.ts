import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerRequest from '../../../links/seller-request'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { createRequestWorkflow } from '../../../workflows/requests/workflows'
import { VendorCreateRequestType } from './validators'

/**
 * @oas [get] /vendor/requests
 * operationId: "VendorListRequests"
 * summary: "List requests"
 * description: "Retrieves submited requests list"
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
 *             requests:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorRequest"
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
 *   - Vendor Requests
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: requests, metadata } = await query.graph({
    entity: sellerRequest.entryPoint,
    fields: req.queryConfig.fields.map((field) => `request.${field}`),
    filters: {
      ...req.filterableFields,
      deleted_at: {
        $eq: null
      }
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    requests: requests.map((relation) => relation.request),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

/**
 * @oas [post] /vendor/requests
 * operationId: "VendorCreateRequest"
 * summary: "Create a request to admin"
 * description: "Creates a request to admin to accept new resource"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateRequest"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             request:
 *               $ref: "#/components/schemas/VendorRequest"
 * tags:
 *   - Vendor Requests
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateRequestType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result } = await createRequestWorkflow.run({
    input: {
      data: {
        submitter_id: req.auth_context.actor_id,
        ...req.validatedBody.request
      },
      seller_id: seller.id
    },
    container: req.scope
  })

  const {
    data: [request]
  } = await query.graph({
    entity: 'request',
    fields: req.queryConfig.fields,
    filters: {
      id: result[0].id
    }
  })

  res.status(201).json({ request })
}
