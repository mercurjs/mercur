import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  FeatureFlag,
} from "@medusajs/framework/utils"
import { MercurFeatureFlags } from "@mercurjs/types"

// Feature flags are resolved once at boot and can't be toggled at runtime, so
// the store setting is the source of truth and the flag is only the fallback.
export const resolveRequireProductApproval = async (
  container: MedusaContainer
): Promise<boolean> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [store],
  } = await query.graph({
    entity: "store",
    fields: ["id", "metadata"],
  })

  const setting = store?.metadata?.require_product_approval

  if (typeof setting === "boolean") {
    return setting
  }

  return FeatureFlag.isFeatureEnabled(MercurFeatureFlags.PRODUCT_REQUEST)
}
