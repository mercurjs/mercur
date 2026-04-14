import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

export const createProductChangeStep = createStep(
  "create-product-change",
  async (
    data: { product_id: string; created_by?: string },
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const change = await service.createProductChanges({
      product_id: data.product_id,
      created_by: data.created_by,
    })
    return new StepResponse(change, change.id)
  },
  async (changeId: string, { container }) => {
    if (!changeId) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProductChanges([changeId])
  }
)
