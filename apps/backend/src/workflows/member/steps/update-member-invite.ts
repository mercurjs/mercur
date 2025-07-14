import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { MemberInviteDTO, UpdateMemberInviteDTO } from '@mercurjs/framework'
import { SELLER_MODULE, SellerModuleService } from '@mercurjs/seller'

/**
 * Updates member invitation with rollback capability.
 */
export const updateMemberInviteStep = createStep(
  'update-member-invite',
  async (input: UpdateMemberInviteDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const previousData: MemberInviteDTO = await service.retrieveMemberInvite(
      input.id
    )

    const updatedInvites: MemberInviteDTO =
      //@ts-expect-error Service method signature mismatch
      await service.updateMemberInvites(input)

    return new StepResponse(updatedInvites, previousData)
  },
  async (previousData: MemberInviteDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)
    //@ts-expect-error Service method signature mismatch
    await service.updateMemberInvites(previousData)
  }
)
