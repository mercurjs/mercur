import { FlagSettings } from "@medusajs/framework/feature-flags"

const SellerInitiatedReturnRequestsFeatureFlag: FlagSettings = {
  key: "seller_initiated_return_requests",
  default_val: true,
  env_key: "MEDUSA_FF_SELLER_INITIATED_RETURN_REQUESTS",
  description: "Allow sellers to open return requests on behalf of customers",
}

export default SellerInitiatedReturnRequestsFeatureFlag
