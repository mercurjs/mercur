import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductChangeActionDTO, MercurModules } from "@mercurjs/types"

import type ProductChangeModuleService from "../../../modules/product-change/service"

export const addProductChangeActionStepId = "pc-add-product-change-action"

export const addProductChangeActionStep = createStep(
  addProductChangeActionStepId,
  async (data: CreateProductChangeActionDTO, { container }) => {
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_CHANGE,
    )
    const [created] = await service.createProductChangeActions([data])
    return new StepResponse(created, created.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    const service = container.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_CHANGE,
    )
    await service.deleteProductChangeActions(id)
  },
)
