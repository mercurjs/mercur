import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductCategoryDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

export const createProductCategoriesStep = createStep(
  "create-product-categories",
  async (data: CreateProductCategoryDTO[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const categories = await service.createProductCategories(data)
    const list = Array.isArray(categories) ? categories : [categories]
    return new StepResponse(
      list,
      list.map((c) => c.id)
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProductCategories(ids)
  }
)
