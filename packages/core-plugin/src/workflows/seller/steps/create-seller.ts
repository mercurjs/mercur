import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateSellerDTO, MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const createSellersStep = createStep(
  "create-sellers",
  async (data: CreateSellerDTO[], { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const sellers = await service.createSellers(data)
    return new StepResponse(
      sellers,
      sellers.map((s) => s.id)
    )
  },
  async (ids: string[], { container }) => {
    if (!ids) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    await service.deleteSellers(ids)
  }
)
