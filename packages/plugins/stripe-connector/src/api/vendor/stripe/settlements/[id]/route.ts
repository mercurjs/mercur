import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { SettlementDetail, VendorSettlementResponse } from "../../../../../types/http"
import { retrieveSettlementDetail, sellerAccountIds } from "../../../../utils/settlements"
import { vendorSellerId } from "../../../../vendor-seller"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<VendorSettlementResponse>) => {
  const accountIds = await sellerAccountIds(req.scope, vendorSellerId(req))
  const settlement = await retrieveSettlementDetail(req.scope, req.params.id, {
    account_id: accountIds.length ? accountIds : ["none"],
  })
  const { account_id: _a, ...rest } = settlement
  rest.adjustments = rest.adjustments.map((line) => ({ ...line, created_by: null }))
  res.json({ settlement: rest as SettlementDetail })
}
