import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

type ConfirmProductChangesStepInput = {
  id: string
  confirmed_by?: string
  internal_note?: string
  external_note?: string
}

export const confirmProductChangesStep = createStep(
  "confirm-product-changes",
  async (data: ConfirmProductChangesStepInput[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.confirmProductChange(data)

    return new StepResponse(void 0)
  }
)
