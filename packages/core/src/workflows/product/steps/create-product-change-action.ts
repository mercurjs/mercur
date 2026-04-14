import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

type CreateProductChangeActionStepInput = {
  product_change_id: string
  product_id: string
  action: string
  details?: Record<string, unknown>
  internal_note?: string
}

export const createProductChangeActionStep = createStep(
  "create-product-change-action",
  async (
    data: CreateProductChangeActionStepInput | CreateProductChangeActionStepInput[],
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const result = await service.addProductAction(data)
    const actions = Array.isArray(result) ? result : [result]

    return new StepResponse(
      result,
      actions.map((a) => a.id)
    )
  },
  async (actionIds: string[], { container }) => {
    if (!actionIds?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProductChangeActions(actionIds)
  }
)
