import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

const FLAG_KEY = "admin_warehouse_management"

/**
 * Gates admin warehouse actions behind the `admin_warehouse_management`
 * feature flag. Baseline Mercur is seller-owned fulfillment — admin should
 * not perform warehouse operations unless the deployment explicitly opts in
 * by setting `MEDUSA_FF_ADMIN_WAREHOUSE_MANAGEMENT=true`.
 */
export const requireAdminWarehouseCapability = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    const featureFlagRouter = req.scope.resolve(
      ContainerRegistrationKeys.FEATURE_FLAG_ROUTER
    ) as any

    if (featureFlagRouter?.isFeatureEnabled?.(FLAG_KEY) === true) {
      return next()
    }

    return next(
      new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Admin warehouse management is not enabled for this deployment."
      )
    )
  } catch (err) {
    return next(err)
  }
}
