import type { SellerContext } from "@mercurjs/core/types/seller-context"
import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export function vendorSellerId(req: AuthenticatedMedusaRequest): string {
  const context: SellerContext | undefined = req.seller_context
  const sellerId = context?.seller_id
  if (!sellerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "No seller in context")
  }
  return sellerId
}
