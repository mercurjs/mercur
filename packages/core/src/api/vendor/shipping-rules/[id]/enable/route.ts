import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { enableSellerShippingRuleWorkflow } from "../../../../../workflows/shipping-rule"
import { refetchShippingOption } from "../../../shipping-options/helpers"
import { validateSellerRegionPrices } from "../../../regions/helpers"
import { VendorEnableShippingRuleType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorEnableShippingRuleType>,
  res: MedusaResponse<HttpTypes.VendorShippingOptionResponse>
) => {
  const sellerId = req.seller_context!.seller_id
  const { stock_location_id, prices, transit_min_days, transit_max_days } =
    req.validatedBody

  if (prices?.length) {
    await validateSellerRegionPrices(req.scope, sellerId, prices)
  }

  const { result } = await enableSellerShippingRuleWorkflow(req.scope).run({
    input: {
      seller_id: sellerId,
      shipping_rule_id: req.params.id,
      stock_location_id,
      prices,
      transit_min_days,
      transit_max_days,
    },
  })

  const shippingOption = await refetchShippingOption(
    req.scope,
    result.id,
    req.queryConfig.fields
  )

  res.status(201).json({ shipping_option: shippingOption })
}
