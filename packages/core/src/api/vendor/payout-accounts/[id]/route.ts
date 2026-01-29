import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerPayoutAccount } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPayoutAccountResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id

  await validateSellerPayoutAccount(req.scope, sellerId, req.params.id)

  const {
    data: [payout_account],
  } = await query.graph({
    entity: "payout_account",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ payout_account })
}
