import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

type CreateProductChangesStepInput = {
  product_id: string
  created_by?: string
}

export const createProductChangesStep = createStep(
  "create-product-changes",
  async (data: CreateProductChangesStepInput[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    const changes = await service.createProductChanges(
      data.map((item) => ({
        product_id: item.product_id,
        created_by: item.created_by,
      }))
    )

    return new StepResponse(
      changes,
      changes.map((c) => c.id)
    )
  },
  async (changeIds: string[], { container }) => {
    if (!changeIds?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProductChanges(changeIds)
  }
)
