import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /vendor/onboarding
 * operationId: "VendorGetOnboarding"
 * summary: "Get Onboarding Status"
 * description: "Retrieves the onboarding status for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: fields
 *     schema:
 *       type: string
 *     description: Comma-separated fields that should be included in the returned data.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             onboarding:
 *               $ref: "#/components/schemas/VendorOnboarding"
 * tags:
 *   - Onboarding
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
    data: [onboarding]
  } = await query.graph({
    entity: 'onboarding',
    fields: req.remoteQueryConfig.fields,
    filters: req.filterableFields
  })

  res.status(200).json({ onboarding })
}
