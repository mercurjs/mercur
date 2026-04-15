import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateProductRejectionReasonDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

type UpdateProductRejectionReasonsStepInput = {
  selector: Record<string, unknown>
  update: UpdateProductRejectionReasonDTO
}

export const updateProductRejectionReasonsStep = createStep(
  "update-product-rejection-reasons",
  async (
    { selector, update }: UpdateProductRejectionReasonsStepInput,
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const prevReasons = await service.listProductRejectionReasons(selector)
    const reasons = await service.updateProductRejectionReasons([
      {
        selector,
        data: update,
      },
    ])
    return new StepResponse(reasons, prevReasons)
  },
  async (prevReasons, { container }) => {
    if (!prevReasons?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProductRejectionReasons(
      prevReasons.map(({ id, code, label, type, is_active, metadata }) => ({
        id,
        code,
        label,
        type,
        is_active,
        metadata,
      }))
    )
  }
)
