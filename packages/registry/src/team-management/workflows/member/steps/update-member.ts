import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { UpdateMemberDTO, MEMBER_MODULE, MemberModuleService } from "../../../modules/member"

export const updateMemberStep = createStep(
  "update-member",
  async (input: UpdateMemberDTO, { container }) => {
    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    const previousData = await service.retrieveMember(input.id)

    const updatedMember = await service.updateMembers(input)

    return new StepResponse(updatedMember, previousData)
  },
  async (previousData, { container }) => {
    if (!previousData) return
    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    await service.updateMembers(previousData)
  }
)
