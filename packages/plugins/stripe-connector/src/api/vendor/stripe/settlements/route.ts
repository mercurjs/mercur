import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sellerAccountIds } from "../../../../pipeline/settlements"
import { listSettlements } from "../../../../pipeline/settlement-views"
import { SettlementListItem, VendorSettlementListResponse } from "../../../../types/http"
import { vendorSellerId } from "../../../vendor-seller"

const stripOperatorFields = ({ account_id: _a, ...rest }: SettlementListItem) => rest as SettlementListItem

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<VendorSettlementListResponse>) => {
  const accountIds = await sellerAccountIds(req.scope, vendorSellerId(req))
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
