import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /vendor/me
 * operationId: "VendorGetMemberMe"
 * summary: "Get Current Member"
 * description: "Retrieves the member associated with the authenticated user."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             member:
 *               $ref: "#/components/schemas/VendorMember"
 * tags:
 *   - Vendor Current Member
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
    data: [member]
  } = await query.graph(
    {
      entity: 'member',
      fields: req.queryConfig.fields,
      filters: { id: req.auth_context.actor_id }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ member })
}
