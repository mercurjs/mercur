import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'
import { CreateMemberInviteDTO } from '@mercurjs/types'
import SellerModuleService from 'src/modules/seller/service'

import { SELLER_MODULE } from '../../../modules/seller'

export const createMemberInviteStep = createStep(
  'create-member-invite',
  async (input: CreateMemberInviteDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const [memberInvite] = await service.createInvites(input)

    return new StepResponse(memberInvite, memberInvite.id)
  },
  async (memberInviteId: string, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.deleteInvites([memberInviteId])
  }
)
