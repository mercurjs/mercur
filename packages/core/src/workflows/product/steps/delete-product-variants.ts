import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

export const deleteProductVariantsStep = createStep(
  "delete-product-variants",
  async (ids: string[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.softDeleteProductVariants(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids: string[], { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.restoreProductVariants(ids)
  }
)
