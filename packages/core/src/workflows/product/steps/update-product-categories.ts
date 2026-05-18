import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateProductCategoryDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

type UpdateProductCategoriesStepInput = (UpdateProductCategoryDTO & {
  id: string
})[]

export const updateProductCategoriesStep = createStep(
  "update-product-categories",
  async (data: UpdateProductCategoriesStepInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const ids = data.map((c) => c.id)
    const prevCategories = await service.listProductCategories({ id: ids })
    const result = await service.updateProductCategories(data)
    const categories = Array.isArray(result) ? result : [result]
    return new StepResponse(categories, prevCategories)
  },
  async (prevCategories: any[] | undefined, { container }) => {
    if (!prevCategories?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProductCategories(
      prevCategories.map((c) => ({ ...c }))
    )
  }
)
