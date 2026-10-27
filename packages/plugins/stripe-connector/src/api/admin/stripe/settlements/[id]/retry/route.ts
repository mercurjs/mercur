import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PayoutStatus } from "@mercurjs/types"

import { retrieveSettlement } from "../../../../../../pipeline/settlement-views"
import { AdminSettlementResponse } from "../../../../../../types/http"
import { resolveConnector, resolvePayoutModule } from "../../../../../../utils/payout-module"

const RETRIABLE = [PayoutStatus.PENDING, PayoutStatus.FAILED, PayoutStatus.ON_HOLD]

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminSettlementResponse>) => {
  const connector = resolveConnector(req.scope)
  const settlement = await connector.retrieveSettlement(req.params.id)

  if (!settlement.payout_status || !RETRIABLE.includes(settlement.payout_status)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Settlement ${settlement.id} has no failed or held payout to retry`
    )
  }

  const account = await resolvePayoutModule(req.scope).retrievePayoutAccount(settlement.account_id)
  if (!account.payouts_enabled || !account.external_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Payout account ${account.id} cannot receive payouts yet`)
  }

  await connector.dispatchSettlementPayout(settlement.id, account.external_id)

  res.json({ settlement: await retrieveSettlement(req.scope, settlement.id) })
}
