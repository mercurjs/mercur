import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

type WithSellerContext = { seller_context?: { seller_id: string } }

/** The seller core's `/vendor/*` middleware resolved for this request. */
export function vendorSellerId(req: AuthenticatedMedusaRequest): string {
  const sellerId = (req as unknown as WithSellerContext).seller_context?.seller_id
  if (!sellerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "No seller in context")
  }
  return sellerId
}
