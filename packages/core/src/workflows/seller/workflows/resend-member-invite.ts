import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"
import {
  createMemberInvitesStep,
  deleteMemberInviteStep,
} from "../steps"
import { MemberInviteWorkflowEvents } from "../../events"

type ResendMemberInviteWorkflowInput = {
  invite_id: string
  seller_id: string
}

const loadInviteStep = createStep(
  "load-member-invite",
  async (
    input: { invite_id: string; seller_id: string },
    { container }
  ) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)

    const invites = await service.listMemberInvites({
      id: input.invite_id,
      seller_id: input.seller_id,
    })

    const invite = invites[0]

    if (!invite) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Invite ${input.invite_id} not found`
      )
    }

    return new StepResponse({
      email: invite.email,
      role_id: invite.role_id,
      seller_id: invite.seller_id,
    })
  }
)

export const resendMemberInviteWorkflowId = "resend-member-invite"

export const resendMemberInviteWorkflow = createWorkflow(
  resendMemberInviteWorkflowId,
  function (input: ResendMemberInviteWorkflowInput) {
    const existing = loadInviteStep(input)

    deleteMemberInviteStep([input.invite_id])

    const createInput = transform({ existing }, ({ existing }) => [
      {
        seller_id: existing.seller_id,
        email: existing.email,
        role_id: existing.role_id,
      },
    ])

    const invites = createMemberInvitesStep(createInput)

    emitEventStep({
      eventName: MemberInviteWorkflowEvents.CREATED,
      data: transform({ invites }, ({ invites }) =>
        invites.map((inv) => ({
          id: inv.id,
          token: inv.token,
          expires_at: inv.expires_at,
        }))
      ),
    })

    return new WorkflowResponse(invites)
  }
)
