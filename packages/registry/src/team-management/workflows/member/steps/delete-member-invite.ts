import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { MEMBER_MODULE, MemberModuleService } from "../../../modules/member"

export const deleteMemberInvitesStep = createStep(
  "delete-member-invite",
  async (id: string, { container }) => {
    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    await service.softDeleteMemberInvites(id)

    return new StepResponse(id)
  },
  async (inviteId: string | undefined, { container }) => {
    if (!inviteId) return

    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    await service.restoreMemberInvites(inviteId)
  }
)
