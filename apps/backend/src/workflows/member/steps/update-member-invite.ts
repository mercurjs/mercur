import SellerModuleService from 'src/modules/seller/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import {
  MemberInviteDTO,
  UpdateMemberInviteDTO
} from '../../../modules/seller/types'

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
