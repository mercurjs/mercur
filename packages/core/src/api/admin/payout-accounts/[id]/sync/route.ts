import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { syncPayoutAccountWorkflow } from "../../../../../workflows/payout"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutAccountResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [link],
  } = await query.graph({
    entity: "seller_payout_account",
    fields: ["seller_id"],
    filters: { payout_account_id: req.params.id },
  })

  await syncPayoutAccountWorkflow(req.scope).run({
    input: { account_id: req.params.id, seller_id: link?.seller_id ?? null },
  })

  const {
    data: [payout_account],
  } = await query.graph({
    entity: "payout_account",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ payout_account })
}
