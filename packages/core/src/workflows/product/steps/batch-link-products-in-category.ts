import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import ProductModuleService from "../../../modules/product/service"

type BatchLinkProductsToCategoryInput = {
  id: string
  add?: string[]
  remove?: string[]
}

export const batchLinkProductsToCategoryStep = createStep(
  "batch-link-products-to-category",
  async (data: BatchLinkProductsToCategoryInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    if (!data.add?.length && !data.remove?.length) {
      return new StepResponse(void 0, null)
    }

    const toRemoveSet = new Set(data.remove ?? [])
    const dbProducts = await service.listProducts(
      { id: [...(data.add ?? []), ...(data.remove ?? [])] },
      {
        select: ["id"] as any,
        relations: ["categories"],
      }
    )

    const productsWithUpdatedCategories = dbProducts.map((p: any) => {
      const currentCategoryIds = (p.categories ?? []).map((c: any) => c.id)

      if (toRemoveSet.has(p.id)) {
        return {
          id: p.id,
          categories: currentCategoryIds.filter(
            (id: string) => id !== data.id
          ),
        }
      }

      return {
        id: p.id,
        categories: [...currentCategoryIds, data.id],
      }
    })

    await service.updateProducts(productsWithUpdatedCategories)

    return new StepResponse(void 0, {
      id: data.id,
      add: data.add,
      remove: data.remove,
      productIds: productsWithUpdatedCategories.map((p) => p.id),
    })
  },
  async (prevData, { container }) => {
    if (!prevData) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    const dbProducts = await service.listProducts(
      { id: prevData.productIds },
      {
        select: ["id"] as any,
        relations: ["categories"],
      }
    )

    const toRemoveSet = new Set(prevData.remove ?? [])
    const productsWithRevertedCategories = dbProducts.map((p: any) => {
      const currentCategoryIds = (p.categories ?? []).map((c: any) => c.id)

      if (toRemoveSet.has(p.id)) {
        return {
          id: p.id,
          categories: [...currentCategoryIds, prevData.id],
        }
      }

      return {
        id: p.id,
        categories: currentCategoryIds.filter(
          (id: string) => id !== prevData.id
        ),
      }
    })

    await service.updateProducts(productsWithRevertedCategories)
  }
)
