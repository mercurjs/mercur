import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, MemberInviteDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

type CreateMemberInviteStepInput = {
  seller_id: string
  email: string
  role_handle: string
}

export const createMemberInviteStep = createStep(
  "create-member-invite",
  async (input: CreateMemberInviteStepInput, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    const invite: MemberInviteDTO = await service.createMemberInvites({
      email: input.email,
      seller_id: input.seller_id,
      role_handle: input.role_handle,
    })

    return new StepResponse(invite, invite.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    await service.deleteMemberInvites([id])
  }
)
