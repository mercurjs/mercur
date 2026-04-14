import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { ProductChangeDTO } from "@mercurjs/types"
import ProductModuleService from "../../../modules/product/service"

type ConfirmProductChangeStepInput = {
  id: string
  confirmed_by?: string
}

export const confirmProductChangeStep = createStep(
  "confirm-product-change",
  async (
    data: ConfirmProductChangeStepInput | ConfirmProductChangeStepInput[],
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const items = Array.isArray(data) ? data : [data]
    const ids = items.map((item) => item.id)

    const prevDataList = await service.listProductChanges(
      { id: ids },
      { select: ["id", "status", "confirmed_by", "confirmed_at"] }
    )

    await service.confirmProductChange(data)

    return new StepResponse(void 0, prevDataList as ProductChangeDTO[])
  },
  async (prevDataList: ProductChangeDTO[], { container }) => {
    if (!prevDataList?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProductChanges(prevDataList)
  }
)
