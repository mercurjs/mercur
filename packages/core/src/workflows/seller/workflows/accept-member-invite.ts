import {
  createHook,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  setAuthAppMetadataStep,
} from "@medusajs/medusa/core-flows"
import { AdditionalData } from "@medusajs/framework/types"
import { MemberInviteDTO } from "@mercurjs/types"

import {
  validateMemberInviteTokenStep,
  upsertMembersStep,
  createSellerMembersStep,
  deleteMemberInviteStep,
  checkSellerHasOwnerStep,
  validateInviteRecipientStep,
} from "../steps"
import { MemberInviteWorkflowEvents } from "../../events"

export const acceptMemberInviteWorkflowId = "accept-member-invite"

type AcceptMemberInviteWorkflowInput = {
  invite_token: string
  auth_identity_id: string
  member_id?: string
  first_name?: string
  last_name?: string
} & AdditionalData

export const acceptMemberInviteWorkflow = createWorkflow(
  acceptMemberInviteWorkflowId,
  function (input: AcceptMemberInviteWorkflowInput) {
    const invite = validateMemberInviteTokenStep(input.invite_token)
    const inviteDTO = transform(
      { invite },
      ({ invite }) => invite as unknown as MemberInviteDTO
    )

    validateInviteRecipientStep(
      transform({ invite, input }, ({ invite, input }) => ({
        invite_email: invite.email,
        auth_identity_id: input.auth_identity_id,
        member_id: input.member_id,
      }))
    )

    const validate = createHook("validate", {
      input,
      invite: inviteDTO,
    })

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

    const ownerCheck = checkSellerHasOwnerStep(
      transform({ invite }, ({ invite }) => ({ seller_id: invite.seller_id }))
    )

    createSellerMembersStep(
      transform(
        { invite, member, ownerCheck },
        ({ invite, member, ownerCheck }) => [{
          seller_id: invite.seller_id,
          member_id: member.id,
          role_id: invite.role_id,
          is_owner: !ownerCheck.hasOwner,
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

    const memberInviteAccepted = createHook("memberInviteAccepted", {
      member,
      invite: inviteDTO,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: MemberInviteWorkflowEvents.ACCEPTED,
      data: { seller_id: invite.seller_id, member_id: member.id },
    })

    return new WorkflowResponse(member, {
      hooks: [validate, memberInviteAccepted],
    })
  }
)
