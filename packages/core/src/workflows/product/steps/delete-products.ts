import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

export const deleteProductsStep = createStep(
  "delete-products",
  async (ids: string[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.softDeleteProducts(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids: string[], { container }) => {
    if (!ids) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.restoreProducts(ids)
  }
)
