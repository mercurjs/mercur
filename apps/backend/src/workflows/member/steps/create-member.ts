import SellerModuleService from 'src/modules/seller/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import { CreateMemberDTO, MemberDTO } from '../../../modules/seller/types'

export const createMemberStep = createStep(
  'create-member',
  async (input: CreateMemberDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const member: MemberDTO = await service.createMembers(input)

    return new StepResponse(member, member.id)
  },
  async (memberId: string, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.deleteMembers([memberId])
  }
)
