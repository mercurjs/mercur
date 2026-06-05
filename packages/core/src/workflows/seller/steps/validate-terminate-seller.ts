import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SellerDTO, SellerStatus } from "@mercurjs/types"

export const validateTerminateSellerStep = createStep(
  "validate-terminate-seller",
  async ({ seller }: { seller: SellerDTO }) => {
    if (seller.status === SellerStatus.TERMINATED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Seller is already terminated"
      )
    }
    if (seller.status === SellerStatus.OPEN) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot terminate an open seller. Suspend or close first."
      )
    }
  }
)
