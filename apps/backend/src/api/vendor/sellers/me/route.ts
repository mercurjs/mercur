import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { fetchSellerByAuthActorId } from '../../../../shared/infra/http/utils/seller'
import { updateSellerWorkflow } from '../../../../workflows/seller/workflows'
import { VendorUpdateSellerType } from '../validators'

/**
 * @oas [get] /vendor/sellers/me
 * operationId: "VendorGetSellerMe"
 * summary: "Get Current Seller"
 * description: "Retrieves the seller associated with the authenticated user."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             seller:
 *               $ref: "#/components/schemas/VendorSeller"
 * tags:
 *   - Vendor Sellers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ seller })
}

/**
 * @oas [post] /vendor/sellers/me
 * operationId: "VendorUpdateSellerMe"
 * summary: "Update Current Seller"
 * description: "Updates the seller associated with the authenticated user."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorUpdateSeller"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             seller:
 *               $ref: "#/components/schemas/VendorSeller"
 * tags:
 *   - Vendor Sellers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateSellerType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  await updateSellerWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody
    }
  })

  const {
    data: [seller]
  } = await query.graph(
    {
      entity: 'seller',
      fields: req.queryConfig.fields,
      filters: { id }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ seller })
}
