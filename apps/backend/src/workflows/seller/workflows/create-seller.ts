import { parallelize, transform } from '@medusajs/framework/workflows-sdk'
import { setAuthAppMetadataStep } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateMemberDTO, CreateSellerDTO } from '../../../modules/seller/types'
import { createMemberStep } from '../../member/steps'
import { createSellerStep } from '../steps'
import { createOnboardingStep } from '../steps/create-onboarding'

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

    parallelize(
      setAuthAppMetadataStep({
        authIdentityId: input.auth_identity_id,
        actorType: 'seller',
        value: member.id
      }),
      createOnboardingStep({
        seller_id: seller.id
      })
    )

    return new WorkflowResponse(seller)
  }
)
