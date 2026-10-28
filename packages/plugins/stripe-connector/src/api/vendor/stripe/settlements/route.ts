import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { SettlementListItem, VendorSettlementListResponse } from "../../../../types/http"
import { listSettlementRows, sellerAccountIds } from "../../../utils/settlements"
import { vendorSellerId } from "../../../vendor-seller"
import { AdminGetSettlementsParamsType } from "../../../admin/validators"

const stripOperatorFields = ({ account_id: _a, ...rest }: SettlementListItem) => rest as SettlementListItem

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetSettlementsParamsType>,
  res: MedusaResponse<VendorSettlementListResponse>
) => {
  const accountIds = await sellerAccountIds(req.scope, vendorSellerId(req))
  const result = await listSettlementRows(
    req.scope,
    { ...req.filterableFields, account_id: accountIds.length ? accountIds : ["none"] },
    req.queryConfig.pagination
  )
  res.json({ ...result, settlements: result.settlements.map(stripOperatorFields) })
}
