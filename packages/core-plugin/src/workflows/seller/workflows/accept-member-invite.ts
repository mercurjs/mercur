import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows"

import {
  validateMemberInviteTokenStep,
  upsertMembersStep,
  createSellerMembersStep,
  deleteMemberInviteStep,
} from "../steps"
import { MemberInviteWorkflowEvents } from "../../events"

export const acceptMemberInviteWorkflowId = "accept-member-invite"

type AcceptMemberInviteWorkflowInput = {
  invite_token: string
  auth_identity_id: string
  member: { email: string }
}

export const acceptMemberInviteWorkflow = createWorkflow(
  acceptMemberInviteWorkflowId,
  function (input: AcceptMemberInviteWorkflowInput) {
    const invite = validateMemberInviteTokenStep(input.invite_token)

    const { data: role } = useQueryGraphStep({
      entity: "role",
      fields: ["id"],
      filters: { handle: invite.role_handle },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-invite-role" })

    const members = upsertMembersStep(
      transform({ invite }, ({ invite }) => [{ email: invite.email }])
    )

    const member = transform({ members }, ({ members }) => members[0])

    const sellerMembers = createSellerMembersStep(
      transform(
        { invite, member, role },
        ({ invite, member, role }) => [{
          seller_id: invite.seller_id,
          member_id: member.id,
          role_id: role[0].id,
        }]
      )
    )

    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: "member",
      value: member.id,
    })

    deleteMemberInviteStep([invite.id])

    emitEventStep({
      eventName: MemberInviteWorkflowEvents.ACCEPTED,
      data: { seller_id: invite.seller_id, member_id: member.id },
    })

    return new WorkflowResponse(member)
  }
)
