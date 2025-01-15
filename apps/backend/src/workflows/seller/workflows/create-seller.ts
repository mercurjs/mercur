import { transform } from '@medusajs/framework/workflows-sdk'
import {
  emitEventStep,
  setAuthAppMetadataStep
} from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateMemberDTO, CreateSellerDTO } from '../../../modules/seller/types'
import { createMemberStep } from '../../member/steps'
import { createSellerStep } from '../steps'
import { SELLER_CREATED_EVENT } from '../../../shared/constants'

import { setEmailVerifiedMetadataStep } from '../../verify-email/steps/set-email-verified-metadata-step'
import { createVerifyEmailLinkStep } from '../../verify-email/steps/create-verify-email-link-step'

type CreateSellerWorkflowInput = {
  seller: CreateSellerDTO
  member: Omit<CreateMemberDTO, 'seller_id'>
  auth_identity_id: string
}

export const createSellerWorkflow = createWorkflow(
  'create-seller',
  function (input: CreateSellerWorkflowInput) {
    const seller = createSellerStep(input.seller)

    setEmailVerifiedMetadataStep({
      authIdentityId: input.auth_identity_id,
      value: false
    })

    const memberInput = transform(
      { seller, member: input.member },
      ({ member, seller }) => ({
        ...member,
        seller_id: seller.id
      })
    )

    const member = createMemberStep(memberInput)

    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: 'seller',
      value: member.id
    })

		const { link } = createVerifyEmailLinkStep({ authIdentityId: input.auth_identity_id, email: seller.email })

    emitEventStep({
      eventName: SELLER_CREATED_EVENT,
      data: { email: seller.email, link }
    })

    return new WorkflowResponse(seller)
  }
)
