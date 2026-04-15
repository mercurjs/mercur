import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

type CreateProductChangeActionsStepInput = {
  product_change_id: string
  product_id: string
  action: string
  details?: Record<string, unknown>
  internal_note?: string
}

export const createProductChangeActionsStep = createStep(
  "create-product-change-actions",
  async (data: CreateProductChangeActionsStepInput[], { container }) => {
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
