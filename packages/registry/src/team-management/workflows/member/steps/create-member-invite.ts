import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { CreateMemberInviteDTO, MEMBER_MODULE, MemberModuleService } from "../../../modules/member"

export const createMemberInviteStep = createStep(
  "create-member-invite",
  async (input: CreateMemberInviteDTO, { container }) => {
    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    const [memberInvite] = await service.createMemberInvites(input)

    return new StepResponse(memberInvite, memberInvite?.id ?? "")
  },
  async (memberInviteId: string | undefined, { container }) => {
    if (!memberInviteId) return

    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    await service.deleteMemberInvites([memberInviteId as string])
  }
)
