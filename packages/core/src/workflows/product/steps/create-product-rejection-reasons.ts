import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductRejectionReasonDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

export const createProductRejectionReasonsStep = createStep(
  "create-product-rejection-reasons",
  async (data: CreateProductRejectionReasonDTO[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const reasons = await service.createProductRejectionReasons(data)
    return new StepResponse(
      reasons,
      reasons.map((r) => r.id)
    )
  },
  async (ids: string[], { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProductRejectionReasons(ids)
  }
)
