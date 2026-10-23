import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { listSettlements, sellerAccountIds } from "../../utils/settlements"

const stripOperatorFields = (row: HttpTypes.SettlementListItem) => {
  const { account_id: _a, provider_id: _p, ...rest } = row
  return rest as HttpTypes.SettlementListItem
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSettlementListResponse>
) => {
  const accountIds = await sellerAccountIds(req.scope, req.seller_context!.seller_id)
  const offset = Number(req.query.offset ?? 0)
  const limit = Math.min(Number(req.query.limit ?? 20), 200)

  if (!accountIds.length) {
    res.json({ settlements: [], count: 0, offset, limit })
    return
  }

  const filters: Record<string, unknown> = { account_id: accountIds }
  if (req.query.status) filters.status = req.query.status
  if (req.query.currency_code) filters.currency_code = req.query.currency_code

  const { settlements, count } = await listSettlements(req.scope, { filters, skip: offset, take: limit })
  res.json({ settlements: settlements.map(stripOperatorFields), count, offset, limit })
}
