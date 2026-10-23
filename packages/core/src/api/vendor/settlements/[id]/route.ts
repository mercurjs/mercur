import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { retrieveSettlement, sellerAccountIds } from "../../../utils/settlements"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSettlementResponse>
) => {
  const accountIds = await sellerAccountIds(req.scope, req.seller_context!.seller_id)
  const settlement = await retrieveSettlement(req.scope, req.params.id, { account_id: accountIds.length ? accountIds : ["none"] })
  const { account_id: _a, provider_id: _p, ...rest } = settlement
  rest.adjustments = rest.adjustments.map(({ created_by: _c, ...line }) => ({ ...line, created_by: null }))
  res.json({ settlement: rest as HttpTypes.SettlementDetail })
}
