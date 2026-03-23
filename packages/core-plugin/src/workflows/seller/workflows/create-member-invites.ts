import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { createMemberInvitesStep } from "../steps"
import { MemberInviteWorkflowEvents } from "../../events"

export const createMemberInvitesWorkflowId = "create-member-invites"

type CreateMemberInvitesWorkflowInput = {
  seller_id: string
  email: string
  role_handle: string
}[]

export const createMemberInvitesWorkflow = createWorkflow(
  createMemberInvitesWorkflowId,
  function (input: CreateMemberInvitesWorkflowInput) {
    const invites = createMemberInvitesStep(input)

    emitEventStep({
      eventName: MemberInviteWorkflowEvents.CREATED,
      data: transform({ invites }, ({ invites }) =>
        invites.map((inv) => ({ id: inv.id }))
      ),
    })

    return new WorkflowResponse(invites)
  }
)
