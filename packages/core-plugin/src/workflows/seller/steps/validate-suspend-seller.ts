import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SellerDTO, SellerStatus } from "@mercurjs/types"

export const validateSuspendSellerStep = createStep(
  "validate-suspend-seller",
  async ({ seller }: { seller: SellerDTO }) => {
    if (seller.status === SellerStatus.TERMINATED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot suspend a terminated seller"
      )
    }
    if (seller.status === SellerStatus.SUSPENDED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Seller is already suspended"
      )
    }
    if (seller.status === SellerStatus.PENDING_APPROVAL) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot suspend a seller that is pending approval"
      )
    }
  }
)
