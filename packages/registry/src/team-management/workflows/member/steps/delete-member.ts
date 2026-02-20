import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { MemberRole, MEMBER_MODULE, MemberModuleService } from "../../../modules/member"

export const deleteMemberStep = createStep(
  "delete-member",
  async (id: string, { container }) => {
    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    const member = await service.retrieveMember(id)

    if (member.role === MemberRole.OWNER) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Owner member cannot be deleted"
      )
    }

    await service.softDeleteMembers(id)

    return new StepResponse(id)
  },
  async (memberId: string | undefined, { container }) => {
    if (!memberId) return

    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    await service.restoreMembers(memberId)
  }
)
