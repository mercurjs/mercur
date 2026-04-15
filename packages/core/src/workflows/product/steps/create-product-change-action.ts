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
  async (data: CreateProductChangeActionStepInput[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const actions = await service.addProductAction(data)

    return new StepResponse(
      actions,
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
