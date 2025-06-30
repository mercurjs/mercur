import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import { syncStripeAccountWorkflow } from '../../../../workflows/seller/workflows'

/**
 * @oas [post] /vendor/payout-account/sync
 * operationId: "VendorSyncPayoutAccount"
 * summary: "Sync Payout Account"
 * description: "Synchronizes the payout account data with the payment processor for the authenticated vendor/seller."
 * x-authenticated: true
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
 *   "401":
 *     description: Unauthorized
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Unauthorized"
 *   "403":
 *     description: Forbidden
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Forbidden"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Payout account not found"
 * tags:
 *   - Vendor Payout Account
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [member]
  } = await query.graph({
    entity: 'member',
    fields: ['seller.payout_account.id'],
    filters: {
      id: req.auth_context.actor_id
    }
  })

  if (!member.seller.payout_account) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Payout account not found'
    )
  }

  const { result: payout_account } = await syncStripeAccountWorkflow.run({
    container: req.scope,
    input: member.seller.payout_account.id
  })

  return res.json({ payout_account })
}
