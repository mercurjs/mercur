import { createSellerWorkflow } from "@mercurjs/core-plugin/workflows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SellerStatus } from "@mercurjs/types"

createSellerWorkflow.hooks.validateSellerInput(
  async ({ input }) => {
    if (input.seller.status === SellerStatus.ACTIVE) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Seller cannot be created with status "active". Use "pending" status and submit for review.`
      )
    }

    return new StepResponse(undefined)
  }
)
