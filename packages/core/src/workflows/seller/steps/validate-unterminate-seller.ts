import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SellerDTO, SellerStatus } from "@mercurjs/types"

export const validateUnterminateSellerStep = createStep(
  "validate-unterminate-seller",
  async ({ seller }: { seller: SellerDTO }) => {
    if (seller.status !== SellerStatus.TERMINATED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only terminated sellers can be unterminated"
      )
    }
  }
)
