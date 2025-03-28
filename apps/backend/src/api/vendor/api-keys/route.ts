import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  container
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { fetchSellerByAuthContext } from '../../../shared/infra/http/utils'
import { createSellerApiKeyWorkflow } from '../../../workflows/seller/workflows'
import { VendorCreateSellerApiKeyType } from './validators'

/**
 * @oas [get] /vendor/api-keys
 * operationId: "VendorGetSellerMyApiKeys"
 * summary: "Get api keys of the current seller"
 * description: "Retrieves the api keys associated with the seller."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             api_keys:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/SellerApiKey"
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
 *   - Seller
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: api_keys, metadata } = await query.graph({
    entity: 'seller_api_key',
    fields: [
      'id',
      'title',
      'redacted',
      'created_by',
      'revoked_at',
      'revoked_by'
    ],
    filters: req.filterableFields
  })

  res.json({
    api_keys,
    count: metadata?.count,
    skip: metadata?.skip,
    take: metadata?.take
  })
}

/**
 * @oas [post] /vendor/api-keys
 * operationId: "VendorCreateApiKey"
 * summary: "Create seller api key"
 * description: "Creates a seller api key"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateSellerApiKey"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             api_key:
 *               $ref: "#/components/schemas/SellerApiKeyExplicit"
 * tags:
 *   - Seller
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateSellerApiKeyType>,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthContext(req.auth_context, req.scope)

  const { result: api_key } = await createSellerApiKeyWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      seller_id: seller.id,
      created_by: req.auth_context.actor_id
    }
  })

  res.status(201).json({ api_key })
}
