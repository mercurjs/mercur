import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { MemberDTO, UpdateMemberDTO } from '@mercurjs/framework'
import { SELLER_MODULE, SellerModuleService } from '@mercurjs/seller'

export const updateMemberStep = createStep(
  'update-member',
  async (input: UpdateMemberDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const previousData = await service.retrieveMember(input.id)

    const updatedMember: MemberDTO = await service.updateMembers(input)

    return new StepResponse(updatedMember, previousData as UpdateMemberDTO)
  },
  async (previousData: UpdateMemberDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.updateMembers(previousData)
  }
)
