import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, PayoutAccountStatus } from "@mercurjs/types"

import { syncPayoutAccountWorkflow } from "../../../../workflows/payout"

const SYNC_AFTER_MS = 30 * 1000

const FIELDS = [
  "id",
  "provider_id",
  "provider_account_id",
  "status",
  "kyc_status",
  "payouts_enabled",
  "charges_enabled",
  "details_submitted",
  "disabled_reason",
  "requirements",
  "ignored",
  "last_synced_at",
  "created_at",
  "updated_at",
  "onboarding.id",
  "onboarding.account_id",
  "onboarding.data",
  "onboarding.created_at",
  "onboarding.updated_at",
]

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPayoutAccountMeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id

  const load = async () => {
    const {
      data: [account],
    } = await query.graph({
      entity: "payout_account",
      fields: FIELDS,
      filters: { seller: { id: sellerId } },
    })
    return account ?? null
  }

  let payout_account = await load()

  // A seller coming back from the provider's onboarding expects the page to
  // reflect it even before the webhook lands, so refresh a not-yet-active
  // account from the provider when the mirror is older than a few seconds.
  const stale =
    payout_account &&
    payout_account.status !== PayoutAccountStatus.ACTIVE &&
    (!payout_account.last_synced_at ||
      Date.now() - new Date(payout_account.last_synced_at).getTime() > SYNC_AFTER_MS)

  if (stale) {
    const { errors } = await syncPayoutAccountWorkflow(req.scope).run({
      input: { account_id: payout_account.id, seller_id: sellerId },
      throwOnError: false,
    })
    if (!errors?.length) {
      payout_account = await load()
    }
  }

  res.json({ payout_account })
}
