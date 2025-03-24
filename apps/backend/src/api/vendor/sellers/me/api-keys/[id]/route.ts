import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  container
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { revokeSellerApiKeyWorkflow } from '../../../../../../workflows/seller/workflows'

/**
 * @oas [get] /vendor/sellers/me/api-keys/{id}
 * operationId: "VendorGetSellerApiKeyById"
 * summary: "Get an api key by id"
 * description: "Retrieves an api key by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the API key.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             api_key:
 *               $ref: "#/components/schemas/SellerApiKey"
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

  const {
    data: [api_key]
  } = await query.graph({
    entity: 'seller_api_key',
    fields: [
      'id',
      'title',
      'redacted',
      'created_by',
      'revoked_at',
      'revoked_by'
    ],
    filters: { id: req.params.id }
  })

  res.json({ api_key })
}

/**
 * @oas [delete] /vendor/sellers/me/api-keys/{id}
 * operationId: "VendorRevokeSellerApiKeyById"
 * summary: "Revoke an api key by id"
 * description: "Revokes an api key by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the API key.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             api_key:
 *               $ref: "#/components/schemas/SellerApiKey"
 * tags:
 *   - Seller
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  await revokeSellerApiKeyWorkflow.run({
    container: req.scope,
    input: {
      id: req.params.id,
      revoked_by: req.auth_context.actor_id
    }
  })

  const {
    data: [api_key]
  } = await query.graph({
    entity: 'seller_api_key',
    fields: [
      'id',
      'title',
      'redacted',
      'created_by',
      'revoked_at',
      'revoked_by'
    ],
    filters: { id: req.params.id }
  })

  res.json({ api_key })
}
