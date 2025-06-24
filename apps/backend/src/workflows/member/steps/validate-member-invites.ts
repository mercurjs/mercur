import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { AcceptMemberInviteDTO } from '@mercurjs/framework'
import { SELLER_MODULE, SellerModuleService } from '@mercurjs/seller'

export const validateMemberInviteStep = createStep(
  'validate-member-invite',
  async (input: AcceptMemberInviteDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const invite = await service.validateInviteToken(input.token)

    return new StepResponse(invite)
  }
)
