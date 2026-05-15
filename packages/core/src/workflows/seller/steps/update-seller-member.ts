import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

type UpdateSellerMembersStepInput = {
  selector: Record<string, unknown>
  update: Record<string, unknown>
}

export const updateSellerMembersStep = createStep(
  "update-seller-members",
  async ({ selector, update }: UpdateSellerMembersStepInput, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const prev = await service.listSellerMembers(selector)

    const updated = await service.updateSellerMembers(
      prev.map((sm) => ({ id: sm.id, ...update }))
    )

    return new StepResponse(updated, prev)
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    // @ts-expect-error
    await service.updateSellerMembers(prev)
  }
)
