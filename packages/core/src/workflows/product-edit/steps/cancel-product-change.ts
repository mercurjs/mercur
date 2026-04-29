import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

type CancelProductChangeStepInput = {
  id: string
  canceled_by?: string
  internal_note?: string
}

export const cancelProductChangeStep = createStep(
  "cancel-product-change",
  async (input: CancelProductChangeStepInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.cancelProductChange(input.id, {
      canceled_by: input.canceled_by,
      internal_note: input.internal_note,
    })
    return new StepResponse(void 0)
  }
)
