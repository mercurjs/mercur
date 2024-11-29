import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'
import { MemberDTO, UpdateMemberDTO } from '@mercurjs/types'
import SellerModuleService from 'src/modules/seller/service'

import { SELLER_MODULE } from '../../../modules/seller'

export const updateMemberStep = createStep(
  'update-member',
  async (input: UpdateMemberDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const previousData = await service.retrieveMember(input.id)

    const updatedMember: MemberDTO = await service.updateMembers(input)

    return new StepResponse(updatedMember, previousData)
  },
  async (previousData: MemberDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.updateMembers(previousData)
  }
)
