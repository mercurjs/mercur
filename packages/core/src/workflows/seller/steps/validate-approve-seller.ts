import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SellerDTO, SellerStatus } from "@mercurjs/types"

export const validateApproveSellerStep = createStep(
  "validate-approve-seller",
  async ({ seller }: { seller: SellerDTO }) => {
    if (seller.status !== SellerStatus.PENDING_APPROVAL) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only sellers with pending_approval status can be approved"
      )
    }
  }
)
