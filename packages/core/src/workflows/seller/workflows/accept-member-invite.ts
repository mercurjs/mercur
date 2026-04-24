import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  setAuthAppMetadataStep,
} from "@medusajs/medusa/core-flows"

import {
  validateMemberInviteTokenStep,
  upsertMembersStep,
  createSellerMembersStep,
  deleteMemberInviteStep,
  createSellerDefaultRolesStep,
} from "../steps"
import { MemberInviteWorkflowEvents } from "../../events"

export const acceptMemberInviteWorkflowId = "accept-member-invite"

type AcceptMemberInviteWorkflowInput = {
  invite_token: string
  auth_identity_id: string
  member_id?: string
  first_name?: string
  last_name?: string
}

export const acceptMemberInviteWorkflow = createWorkflow(
  acceptMemberInviteWorkflowId,
  function (input: AcceptMemberInviteWorkflowInput) {
    createSellerDefaultRolesStep()

    const invite = validateMemberInviteTokenStep(input.invite_token)

    const members = upsertMembersStep(
      transform({ invite, input }, ({ invite, input }) => [
        {
          email: invite.email,
          first_name: input.first_name ?? null,
          last_name: input.last_name ?? null,
        },
      ])
    )

    const member = transform({ members }, ({ members }) => members[0])

    createSellerMembersStep(
      transform(
        { invite, member },
        ({ invite, member }) => [{
          seller_id: invite.seller_id,
          member_id: member.id,
          role_id: invite.role_id,
        }]
      )
    )

    when('no-existing-member', input, ({ member_id }) => !member_id).then(() => {
      setAuthAppMetadataStep({
        authIdentityId: input.auth_identity_id,
        actorType: "member",
        value: member.id,
      })
    })

    deleteMemberInviteStep([invite.id])

    emitEventStep({
      eventName: MemberInviteWorkflowEvents.ACCEPTED,
      data: { seller_id: invite.seller_id, member_id: member.id },
    })

    return new WorkflowResponse(member)
  }
)
