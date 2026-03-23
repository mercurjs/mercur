import { FlagSettings } from "@medusajs/framework/feature-flags"

const SellerRegistrationFeatureFlag: FlagSettings = {
  key: "seller_registration",
  default_val: false,
  env_key: "MEDUSA_FF_SELLER_REGISTRATION",
  description: "Enable public seller self-registration form",
}

export default SellerRegistrationFeatureFlag
