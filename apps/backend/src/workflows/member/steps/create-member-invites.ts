import SellerModuleService from 'src/modules/seller/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import { CreateMemberInviteDTO } from '../../../modules/seller/types'

export const createMemberInviteStep = createStep(
  'create-member-invite',
  async (input: CreateMemberInviteDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const [memberInvite] = await service.createMemberInvites(input)

    return new StepResponse(memberInvite, memberInvite.id)
  },
  async (memberInviteId: string, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.deleteMemberInvites([memberInviteId])
  }
)
