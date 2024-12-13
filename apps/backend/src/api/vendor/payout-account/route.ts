import sellerPayoutAccountLink from '#/links/seller-payout-account'
import { fetchSellerByAuthActorId } from '#/shared/infra/http/utils'
import { createPayoutAccountForSellerWorkflow } from '#/workflows/seller/workflows/create-payout-account-for-seller'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

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
 *   - Payment Account
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
    data: [sellerPayoutAccount]
  } = await query.graph(
    {
      entity: sellerPayoutAccountLink.entryPoint,
      fields: req.remoteQueryConfig.fields.map(
        (field) => `payout_account.${field}`
      ),
      filters: req.filterableFields
    },
    { throwIfKeyNotFound: true }
  )

  res.json({
    payout_account: sellerPayoutAccount.payout_account
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
 *   - Payment Account
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreatePayoutAccountType>,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result: payoutAccount } = await createPayoutAccountForSellerWorkflow(
    req.scope
  ).run({
    input: {
      seller_id: seller.id,
      payout_account: {
        context: req.validatedBody.context ?? {}
      }
    }
  })

  res.status(201).json({
    payout_account: payoutAccount
  })
}
