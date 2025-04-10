import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import SellerModuleService from '../../../modules/seller/service'
import { AcceptMemberInviteDTO } from '../../../modules/seller/types'

export const validateMemberInviteStep = createStep(
  'validate-member-invite',
  async (input: AcceptMemberInviteDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const invite = await service.validateInviteToken(input.token)

    return new StepResponse(invite)
  }
)
