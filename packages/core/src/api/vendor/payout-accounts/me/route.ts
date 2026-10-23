import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

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

  const {
    data: [payout_account],
  } = await query.graph({
    entity: "payout_account",
    fields: FIELDS,
    filters: { seller: { id: sellerId } },
  })

  res.json({ payout_account: payout_account ?? null })
}
