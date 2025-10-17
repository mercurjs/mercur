import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import {
  createPayoutAccountForSellerWorkflow,
  syncStripeAccountWorkflow
} from '../../../workflows/seller/workflows'
import { refetchPayoutAccount } from './utils'
import { VendorCreatePayoutAccountType } from './validators'

/**
 * @oas [get] /vendor/payout-account
 * operationId: "VendorGetPayoutAccount"
 * summary: "Get Payout Account"
 * description: "Retrieves the payout account for the authenticated vendor."
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
 *             payout_account:
 *               $ref: "#/components/schemas/VendorPayoutAccount"
 * tags:
 *   - Vendor Payout Account
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  let { payout_account } = await refetchPayoutAccount(
    req.scope,
    req.queryConfig.fields.map((field) => `payout_account.${field}`),
    req.filterableFields
  )

  if (payout_account.status !== 'active') {
    await syncStripeAccountWorkflow.run({
      container: req.scope,
      input: payout_account.id
    })

    const refreshed = await refetchPayoutAccount(
      req.scope,
      req.queryConfig.fields.map((field) => `payout_account.${field}`),
      req.filterableFields
    )

    payout_account = refreshed.payout_account
  }

  res.json({
    payout_account
  })
}

/**
 * @oas [post] /vendor/payout-account
 * operationId: "VendorCreatePayoutAccount"
 * summary: "Create Payout Account"
 * description: "Creates a payout account for the authenticated vendor."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreatePayoutAccount"
 * responses:
 *   "201":
 *     description: Created
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
  req: AuthenticatedMedusaRequest<VendorCreatePayoutAccountType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result } = await createPayoutAccountForSellerWorkflow(req.scope).run({
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
        id: result.id
      }
    },
    { throwIfKeyNotFound: true }
  )

  res.status(201).json({
    payout_account: payoutAccount
  })
}
