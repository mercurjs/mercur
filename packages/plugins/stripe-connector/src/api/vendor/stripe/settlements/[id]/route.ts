import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { VendorSettlementResponse } from "../../../../../types/http"
import { refetchSettlement } from "../../../../admin/stripe/settlements/helpers"
import { vendorSellerId } from "../../../../vendor-seller"
import { sellerAccountFilter } from "../helpers"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<VendorSettlementResponse>) => {
  const settlement = await refetchSettlement(
    req.params.id,
    req.scope,
    req.queryConfig.fields,
    await sellerAccountFilter(req.scope, vendorSellerId(req))
  )
  res.json({ settlement })
}
