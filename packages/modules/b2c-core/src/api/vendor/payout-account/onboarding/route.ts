import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { fetchSellerByAuthActorId } from '../../../../shared/infra/http/utils'
import { createOnboardingForSellerWorkflow } from '../../../../workflows/seller/workflows'
import { VendorCreateOnboardingType } from '../validators'

/**
 * @oas [post] /vendor/payout-account/onboarding
 * operationId: "VendorCreateOnboarding"
 * summary: "Create Onboarding"
 * description: "Creates an onboarding for the authenticated vendor's payout account."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateOnboarding"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             payout_account:
 *               $ref: "#/components/schemas/VendorPayoutAccount"
 * tags:
 *   - Vendor Payout Account
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateOnboardingType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result } = await createOnboardingForSellerWorkflow(req.scope).run({
    context: { transactionId: seller.id },
    input: {
      seller_id: seller.id,
      context: req.validatedBody.context ?? {}
    }
  })

  const {
    data: [payoutAccount]
  } = await query.graph(
    {
      entity: 'payout_account',
      fields: req.queryConfig.fields,
      filters: {
        id: result.payout_account_id
      }
    },
    { throwIfKeyNotFound: true }
  )

  res.status(200).json({
    payout_account: payoutAccount
  })
}
