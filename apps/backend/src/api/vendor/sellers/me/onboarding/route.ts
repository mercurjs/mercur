import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { fetchSellerByAuthActorId } from '../../../../../shared/infra/http/utils'
import { recalculateOnboardingWorkflow } from '../../../../../workflows/seller/workflows'

/**
 * @oas [get] /vendor/sellers/me/onboarding
 * operationId: "VendorGetOnboardingStatus"
 * summary: "Get onboarding status of the current seller"
 * description: "Retrieves the onboarding details of the current authenticated seller."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             onboarding:
 *               $ref: "#/components/schemas/VendorSellerOnboarding"
 * tags:
 *   - Vendor Onboarding
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const {
    data: [onboarding]
  } = await query.graph({
    entity: 'seller_onboarding',
    fields: req.queryConfig.fields,
    filters: {
      seller_id: seller.id
    }
  })

  res.json({ onboarding })
}

/**
 * @oas [post] /vendor/sellers/me/onboarding
 * operationId: "VendorRecalculateOnboarding status"
 * summary: "Recalculates onboarding status"
 * description: "Triggers onboarding status recalculation and retrieves the onboarding details of the current authenticated seller."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             onboarding:
 *               $ref: "#/components/schemas/VendorSellerOnboarding"
 * tags:
 *   - Vendor Onboarding
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  await recalculateOnboardingWorkflow.run({
    container: req.scope,
    input: seller.id
  })

  const {
    data: [onboarding]
  } = await query.graph({
    entity: 'seller_onboarding',
    fields: req.queryConfig.fields,
    filters: {
      seller_id: seller.id
    }
  })

  res.json({ onboarding })
}
