import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { MemberInviteDTO, UpdateMemberInviteDTO } from '@mercurjs/framework'
import { SELLER_MODULE, SellerModuleService } from '@mercurjs/seller'

export const updateMemberInviteStep = createStep(
  'update-member-invite',
  async (input: UpdateMemberInviteDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const previousData: MemberInviteDTO = await service.retrieveMemberInvite(
      input.id
    )

    const updatedInvites: MemberInviteDTO =
      //@ts-ignore
      await service.updateMemberInvites(input)

    return new StepResponse(updatedInvites, previousData)
  },
  async (previousData: MemberInviteDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)
    //@ts-ignore
    await service.updateMemberInvites(previousData)
  }
)
