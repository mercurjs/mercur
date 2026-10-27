import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { listVendorShippingRules } from "./helpers"
import { VendorGetShippingRulesParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetShippingRulesParamsType>,
  res: MedusaResponse<HttpTypes.VendorShippingRuleListResponse>
) => {
  const sellerId = req.seller_context!.seller_id
  const { shipping_zone_id, shipping_profile_id, stock_location_id, missing_mandatory } =
    req.validatedQuery as VendorGetShippingRulesParamsType

  const shipping_rules = await listVendorShippingRules(req.scope, sellerId, {
    shipping_zone_id,
    shipping_profile_id,
    stock_location_id,
    missing_mandatory: missing_mandatory as boolean | undefined,
  })

  res.json({
    shipping_rules,
    count: shipping_rules.length,
    offset: 0,
    limit: shipping_rules.length,
  })
}
