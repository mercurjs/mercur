import { FlagSettings } from "@medusajs/framework/feature-flags"

const ProductRequestFeatureFlag: FlagSettings = {
  key: "product_request",
  default_val: true,
  env_key: "MEDUSA_FF_PRODUCT_REQUEST",
  description: "Enable product request workflow for sellers",
}

export default ProductRequestFeatureFlag
