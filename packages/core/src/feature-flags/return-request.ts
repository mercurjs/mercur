import { FlagSettings } from "@medusajs/framework/feature-flags"

const ReturnRequestFeatureFlag: FlagSettings = {
  key: "return_request",
  default_val: true,
  env_key: "MEDUSA_FF_RETURN_REQUEST",
  description: "Enable customer return requests reviewed by sellers and the operator",
}

export default ReturnRequestFeatureFlag
