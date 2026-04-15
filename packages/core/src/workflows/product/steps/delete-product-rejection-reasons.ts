import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import ProductModuleService from "../../../modules/product/service"

export const deleteProductRejectionReasonsStep = createStep(
  "delete-product-rejection-reasons",
  async (ids: string[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.softDeleteProductRejectionReasons(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.restoreProductRejectionReasons(ids)
  }
)
