import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

type UpdateProductsStepInput = {
  selector: Record<string, unknown>
  update: Record<string, unknown>
}

export const updateProductsStep = createStep(
  "update-products",
  async ({ selector, update }: UpdateProductsStepInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const prevProducts = await service.listProducts(selector)
    const products = await service.updateProducts(
      prevProducts.map((p) => ({ id: p.id, ...update }))
    )
    return new StepResponse(products, prevProducts)
  },
  async (prevProducts: any[], { container }) => {
    if (!prevProducts) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProducts(prevProducts)
  }
)
