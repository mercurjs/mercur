import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { ProductChangeDTO } from "@mercurjs/types"
import ProductModuleService from "../../../modules/product/service"

export const declineProductChangeStep = createStep(
  "decline-product-change",
  async (
    data: {
      product_change: ProductChangeDTO
      declined_by?: string
      declined_reason?: string
      rejection_reason_ids?: string[]
    },
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const prevData = { ...data.product_change }

    await service.declineProductChange(data.product_change.id, {
      declined_by: data.declined_by,
      declined_reason: data.declined_reason,
      rejection_reasons: data.rejection_reason_ids?.map((id) => ({ id })),
    })

    return new StepResponse(void 0, prevData)
  },
  async (prevData: ProductChangeDTO, { container }) => {
    if (!prevData) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProductChanges({
      id: prevData.id,
      status: prevData.status,
      declined_by: prevData.declined_by,
      declined_at: prevData.declined_at as any,
      declined_reason: prevData.declined_reason,
    })
  }
)
