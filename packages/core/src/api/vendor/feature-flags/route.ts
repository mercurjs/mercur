import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { FlagRouter } from "@medusajs/framework/utils"
import { MercurFeatureFlags } from "@mercurjs/types"

export const AUTHENTICATE = false

const VENDOR_PANEL_FLAGS = [
  MercurFeatureFlags.SELLER_REGISTRATION,
  MercurFeatureFlags.PRODUCT_REQUEST,
] as const

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<{ feature_flags: Record<string, boolean> }>
) => {
  const featureFlagRouter = req.scope.resolve<FlagRouter>(
    ContainerRegistrationKeys.FEATURE_FLAG_ROUTER
  )

  const featureFlags: Record<string, boolean> = {}
  for (const key of VENDOR_PANEL_FLAGS) {
    featureFlags[key] = featureFlagRouter.isFeatureEnabled(key)
  }

  res.json({ feature_flags: featureFlags })
}
