import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { SellerDTO, UpdateSellerDTO } from "@mercurjs/types"

import { SELLER_MODULE } from "../../../modules/seller"
import SellerModuleService from "../../../modules/seller/service"

export const updateSellerStep = createStep(
  "update-seller",
  async (input: UpdateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

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

    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.updateSellers(previousData)
  }
)
