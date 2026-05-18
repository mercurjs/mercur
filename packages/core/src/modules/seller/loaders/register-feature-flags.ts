/**
 * Workaround: Medusa's feature flag discovery scans only up to depth 2
 * from the project root, so feature flags defined inside plugins
 * (node_modules) are never discovered. This loader manually registers
 * the plugin's feature flags on the global FeatureFlag router.
 */
import { LoaderOptions } from "@medusajs/framework/types"
import { FeatureFlag, registerFeatureFlag } from "@medusajs/framework/utils"
import { configManager } from "@medusajs/framework/config"

import SellerRegistrationFeatureFlag from "../../../feature-flags/seller-registration"
import ProductRequestFeatureFlag from "../../../feature-flags/product-request"

export default async function registerFeatureFlagsLoader({
  container,
}: LoaderOptions) {
  const { featureFlags: projectConfigFlags = {} } = configManager.config

  registerFeatureFlag({
    flag: SellerRegistrationFeatureFlag,
    projectConfigFlags,
    router: FeatureFlag,
  })

  registerFeatureFlag({
    flag: ProductRequestFeatureFlag,
    projectConfigFlags,
    router: FeatureFlag,
  })
}
