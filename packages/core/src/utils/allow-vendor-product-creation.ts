import { MedusaContainer } from "@medusajs/framework/types"

import { resolveStoreBooleanSetting } from "./store-boolean-setting"

// Vendors may create products by default; operators can turn this off per store
export const resolveAllowVendorProductCreation = (
  container: MedusaContainer
): Promise<boolean> =>
  resolveStoreBooleanSetting(
    container,
    "allow_vendor_product_creation",
    () => true
  )
