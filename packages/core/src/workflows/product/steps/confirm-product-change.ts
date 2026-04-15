import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

type ConfirmProductChangeStepInput = {
  id: string
  confirmed_by?: string
}

export const confirmProductChangeStep = createStep(
  "confirm-product-change",
  async (data: ConfirmProductChangeStepInput[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const ids = data.map((item) => item.id)

    const prevDataList = await service.listProductChanges(
      { id: ids },
      { select: ["id", "status", "confirmed_by", "confirmed_at"] }
    )

    await service.confirmProductChange(data)

    return new StepResponse(void 0, prevDataList)
  }
)
