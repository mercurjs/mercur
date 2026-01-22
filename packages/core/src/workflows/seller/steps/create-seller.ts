import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { CreateSellerDTO, SellerDTO } from "../../../modules/seller/types"
import { SELLER_MODULE } from "../../../modules/seller"
import SellerModuleService from "../../../modules/seller/service"

export const createSellerStep = createStep(
  "create-seller",
  async (input: CreateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const seller: SellerDTO = await service.createSellers(input)

    return new StepResponse(seller, seller.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.deleteSellers([id])
  }
)
