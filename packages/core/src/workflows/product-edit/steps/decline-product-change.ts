import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { ProductChangeDTO } from "@mercurjs/types"
import ProductModuleService from "../../../modules/product/service"

type DeclineProductChangeStepInput = {
  product_change: ProductChangeDTO
  declined_by?: string
  declined_reason?: string
}

export const declineProductChangeStep = createStep(
  "decline-product-change",
  async (data: DeclineProductChangeStepInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    await service.declineProductChange(data.product_change.id, {
      declined_by: data.declined_by,
      declined_reason: data.declined_reason,
    })

    return new StepResponse(void 0)
  }
)
