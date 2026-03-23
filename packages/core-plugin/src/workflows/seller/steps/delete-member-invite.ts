import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const deleteMemberInviteStep = createStep(
  "delete-member-invite",
  async (ids: string[], { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    await service.deleteMemberInvites(ids)
    return new StepResponse(void 0)
  }
)
