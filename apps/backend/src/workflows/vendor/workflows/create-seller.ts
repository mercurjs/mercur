import { transform } from '@medusajs/framework/workflows-sdk'
import { setAuthAppMetadataStep } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'
import { CreateMemberDTO, CreateSellerDTO } from '@mercurjs/types'

import { createMemberStep } from '../../member/steps'
import { createSellerStep } from '../steps'

type CreateSellerWorkflowInput = {
  seller: CreateSellerDTO
  member: Omit<CreateMemberDTO, 'seller_id'>
  authIdentityId: string
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

    setAuthAppMetadataStep({
      authIdentityId: input.authIdentityId,
      actorType: 'seller',
      value: member.id
    })

    return new WorkflowResponse(seller)
  }
)
