import SellerModuleService from 'src/modules/seller/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'

export const deleteMemberInvitesStep = createStep(
  'delete-member-invites',
  async (id: string, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.softDeleteMemberInvites(id)

    return new StepResponse(id)
  },
  async (inviteId: string, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.restoreMemberInvites(inviteId)
  }
)
