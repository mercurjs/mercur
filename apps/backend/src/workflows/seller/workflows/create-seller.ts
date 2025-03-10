import { transform } from '@medusajs/framework/workflows-sdk'
import { setAuthAppMetadataStep } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateMemberDTO, CreateSellerDTO } from '../../../modules/seller/types'
import { createMemberStep } from '../../member/steps'
import { createSellerOnboardingStep, createSellerStep } from '../steps'

type CreateSellerWorkflowInput = {
  seller: CreateSellerDTO
  member: Omit<CreateMemberDTO, 'seller_id'>
  auth_identity_id: string
}

export const createSellerWorkflow = createWorkflow(
  'create-seller',
  function (input: CreateSellerWorkflowInput) {
    const seller = createSellerStep(input.seller)

    const memberInput = transform(
      { seller, member: input.member },
      ({ member, seller }) => ({
        ...member,
        seller_id: seller.id
      })
    )

    const member = createMemberStep(memberInput)
    createSellerOnboardingStep(seller)

    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: 'seller',
      value: member.id
    })

    return new WorkflowResponse(seller)
  }
)
