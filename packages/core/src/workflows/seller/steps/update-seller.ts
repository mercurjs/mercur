import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, SellerDTO, UpdateSellerDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

type UpdateSellersStepInput = {
  selector: Record<string, unknown>
  update: UpdateSellerDTO
}

export const updateSellersStep = createStep(
  "update-sellers",
  async ({ selector, update }: UpdateSellersStepInput, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const prevSellers = await service.listSellers(selector)

    const sellers = await service.updateSellers(
      prevSellers.map((s) => ({ id: s.id, ...update }))
    )

    return new StepResponse(sellers, prevSellers)
  },
  async (prevSellers: SellerDTO[], { container }) => {
    if (!prevSellers) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    await service.updateSellers(prevSellers)
  }
)
