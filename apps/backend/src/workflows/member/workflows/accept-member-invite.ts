import { parallelize } from '@medusajs/framework/workflows-sdk'
import { setAuthAppMetadataStep } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptMemberInviteDTO } from '@mercurjs/types'

import { createMemberStep, updateMemberInviteStep } from '../steps'
import { validateMemberInviteStep } from '../steps/validate-member-invites'

type AcceptMemberInviteWorkflowInput = {
  invite: AcceptMemberInviteDTO
  authIdentityId: string
}

export const acceptMemberInvitesWorkflow = createWorkflow(
  'accept-member-invite',
  function (input: AcceptMemberInviteWorkflowInput) {
    const invite = validateMemberInviteStep(input.invite)

    const [member] = parallelize(
      createMemberStep({
        seller_id: invite.seller.id,
        email: invite.email,
        name: input.invite.name,
        role: invite.role
      }),
      updateMemberInviteStep({
        id: invite.id,
        accepted: true
      })
    )

    setAuthAppMetadataStep({
      authIdentityId: input.authIdentityId,
      actorType: 'seller',
      value: member.id
    })

    return new WorkflowResponse(member)
  }
)
