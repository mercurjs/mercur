import { parallelize } from '@medusajs/framework/workflows-sdk'
import { setAuthAppMetadataStep } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { AcceptMemberInviteDTO } from '@mercurjs/framework'

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
        name: input.invite.name,
        role: invite.role,
        email: invite.email
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
