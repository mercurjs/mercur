import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { ProductChangeStatus } from "@mercurjs/types"
import ProductModuleService from "../../../modules/product/service"

type CreateProductChangesStepInput = {
  product_id: string
  created_by?: string
  internal_note?: string
  external_note?: string
  /**
   * Optional initial status. Admin workflows that confirm inline (e.g.
   * reject/request-changes) pass `CONFIRMED` together with `confirmed_by`
   * + `confirmed_at` so the change is born already-closed.
   */
  status?: ProductChangeStatus
  confirmed_by?: string
  confirmed_at?: Date
}

export const createProductChangesStep = createStep(
  "create-product-changes",
  async (data: CreateProductChangesStepInput[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    const changes = await service.createProductChanges(
      data.map((item) => ({
        product_id: item.product_id,
        created_by: item.created_by,
        internal_note: item.internal_note,
        external_note: item.external_note,
        status: item.status,
        confirmed_by: item.confirmed_by,
        confirmed_at: item.confirmed_at,
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
