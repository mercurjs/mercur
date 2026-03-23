import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { createMemberInviteStep } from "../steps"
import { MemberInviteWorkflowEvents } from "../../events"

export const createMemberInviteWorkflowId = "create-member-invite"

type CreateMemberInviteWorkflowInput = {
  seller_id: string
  email: string
  role_handle: string
}

export const createMemberInviteWorkflow = createWorkflow(
  createMemberInviteWorkflowId,
  function (input: CreateMemberInviteWorkflowInput) {
    const invite = createMemberInviteStep(input)

    emitEventStep({
      eventName: MemberInviteWorkflowEvents.CREATED,
      data: { id: invite.id },
    })

    return new WorkflowResponse(invite)
  }
)
