import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules, SellerDTO, UpdateSellerDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const updateSellerStep = createStep(
  "update-seller",
  async (input: UpdateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    const [previousData] = await service.listSellers({
      id: input.id,
    })

    const updatedSeller: SellerDTO = await service.updateSellers(input)

    return new StepResponse(updatedSeller, previousData as UpdateSellerDTO)
  },
  async (previousData: UpdateSellerDTO, { container }) => {
    if (!previousData) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    await service.updateSellers(previousData)
  }
)
