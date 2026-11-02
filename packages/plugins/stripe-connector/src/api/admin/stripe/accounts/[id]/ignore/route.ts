import { AuthenticatedMedusaRequest, MedusaResponse, refetchEntity } from "@medusajs/framework/http"

import { AdminPayoutAccountResponse } from "../../../../../../types/http"
import { ignorePayoutAccountWorkflow } from "../../../../../../workflows/accounts/workflows/ignore-payout-account"
import { AdminIgnoreAccountType } from "../../../../validators"

/** Ignored sellers keep their payout account, but the transfers job never pays their orders out. */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminIgnoreAccountType>,
  res: MedusaResponse<AdminPayoutAccountResponse>
) => {
  await ignorePayoutAccountWorkflow(req.scope).run({
    input: { id: req.params.id, ignored: req.validatedBody.ignored },
  })

  const payout_account = await refetchEntity({
    entity: "payout_account",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.json({ payout_account } as AdminPayoutAccountResponse)
}
