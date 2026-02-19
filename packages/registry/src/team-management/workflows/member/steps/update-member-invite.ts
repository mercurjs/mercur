import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { UpdateMemberInviteDTO, MEMBER_MODULE, MemberModuleService } from "../../../modules/member"

export const updateMemberInviteStep = createStep(
  "update-member-invite",
  async (input: UpdateMemberInviteDTO, { container }) => {
    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    const previousData = await service.retrieveMemberInvite(input.id)

    const updatedInvites = await service.updateMemberInvites(input)

    return new StepResponse(updatedInvites, previousData)
  },
  async (previousData: Record<string, unknown> | undefined, { container }) => {
    if (!previousData) return

    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)
    await service.updateMemberInvites(previousData)
  }
)
