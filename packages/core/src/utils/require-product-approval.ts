import { MedusaContainer } from "@medusajs/framework/types"
import { FeatureFlag } from "@medusajs/framework/utils"
import { MercurFeatureFlags } from "@mercurjs/types"

import { resolveStoreBooleanSetting } from "./store-boolean-setting"

// Feature flags are resolved once at boot and can't be toggled at runtime, so
// the store setting is the source of truth and the flag is only the fallback.
export const resolveRequireProductApproval = (
  container: MedusaContainer
): Promise<boolean> =>
  resolveStoreBooleanSetting(container, "require_product_approval", () =>
    FeatureFlag.isFeatureEnabled(MercurFeatureFlags.PRODUCT_REQUEST)
  )
