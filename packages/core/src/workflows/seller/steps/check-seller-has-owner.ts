import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

type CheckSellerHasOwnerStepInput = {
  seller_id: string
}

export const checkSellerHasOwnerStep = createStep(
  "check-seller-has-owner",
  async (
    { seller_id }: CheckSellerHasOwnerStepInput,
    { container }
  ) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const owners = await service.listSellerMembers({
      seller_id,
      is_owner: true,
    })
    return new StepResponse({ hasOwner: owners.length > 0 })
  }
)
