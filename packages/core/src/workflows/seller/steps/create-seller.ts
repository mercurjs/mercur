import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateSellerDTO, MercurModules, SellerDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const createSellerStep = createStep(
  "create-seller",
  async (input: CreateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    const seller: SellerDTO = await service.createSellers(input)

    return new StepResponse(seller, seller.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    await service.deleteSellers([id])
  }
)
