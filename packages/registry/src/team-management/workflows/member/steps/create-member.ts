import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { CreateMemberDTO, MEMBER_MODULE, MemberModuleService } from "../../../modules/member"

export const createMemberStep = createStep(
  "create-member",
  async (input: CreateMemberDTO, { container }) => {
    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    const member = await service.createMembers(input)

    return new StepResponse(member, member.id)
  },
  async (memberId: string | undefined, { container }) => {
    if (!memberId) return

    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    await service.deleteMembers([memberId])
  }
)
