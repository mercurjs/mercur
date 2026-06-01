import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * Vendor-side "cancel pending product change". The product-edit flow
 * is gone — vendor updates apply directly through `updateProductsWorkflow`
 * — so there is no pending change to cancel. The endpoint is kept for
 * route-table compatibility and returns 410 Gone with a stable code so
 * clients can detect the deprecation.
 */
export const POST = async (
  _req: AuthenticatedMedusaRequest,
  _res: MedusaResponse
) => {
  throw new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    "Product-change cancellation is not supported; updates apply directly."
  )
}
