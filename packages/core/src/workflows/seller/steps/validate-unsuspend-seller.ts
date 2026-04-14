import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SellerDTO, SellerStatus } from "@mercurjs/types"

export const validateUnsuspendSellerStep = createStep(
  "validate-unsuspend-seller",
  async ({ seller }: { seller: SellerDTO }) => {
    if (seller.status !== SellerStatus.SUSPENDED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only suspended sellers can be unsuspended"
      )
    }
  }
)
