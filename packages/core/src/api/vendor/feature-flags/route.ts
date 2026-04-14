import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const AUTHENTICATE = false

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<{ feature_flags: Record<string, boolean> }>
) => {
  const featureFlagRouter = req.scope.resolve(
    ContainerRegistrationKeys.FEATURE_FLAG_ROUTER
  ) as any

  const flags = featureFlagRouter.listFlags()

  const featureFlags: Record<string, boolean> = {}
  flags.forEach((flag: any) => {
    featureFlags[flag.key] = flag.value
  })

  res.json({ feature_flags: featureFlags })
}
