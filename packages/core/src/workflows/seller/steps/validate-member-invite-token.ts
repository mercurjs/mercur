import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const validateMemberInviteTokenStep = createStep(
  "validate-member-invite-token",
  async (token: string, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const invite = await service.validateMemberInviteToken(token)
    return new StepResponse(invite)
  }
)
