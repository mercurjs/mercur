import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { FeatureFlag, MedusaError } from "@medusajs/framework/utils"

export function requireFeatureFlag(flag: string) {
  return (_req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
    if (!FeatureFlag.isFeatureEnabled(flag)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Feature "${flag}" is disabled on this marketplace.`
      )
    }

    next()
  }
}
