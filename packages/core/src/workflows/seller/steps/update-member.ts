import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MemberDTO, MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

type UpdateMembersStepInput = {
  selector: Record<string, unknown>
  update: {
    first_name?: string | null
    last_name?: string | null
    locale?: string | null
  }
}

export const updateMembersStep = createStep(
  "update-members",
  async ({ selector, update }: UpdateMembersStepInput, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const prevMembers = await service.listMembers(selector)

    const members = await service.updateMembers(
      prevMembers.map((m) => ({ id: m.id, ...update }))
    )

    return new StepResponse(members, prevMembers)
  },
  async (prevMembers: MemberDTO[], { container }) => {
    if (!prevMembers) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    await service.updateMembers(prevMembers)
  }
)
