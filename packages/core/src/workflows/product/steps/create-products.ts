import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { CreateProductDTO } from "@mercurjs/types"
import ProductModuleService from "../../../modules/product/service"

export const createProductsStep = createStep(
  "create-products",
  async (data: CreateProductDTO[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const products = await service.createProducts(data)
    return new StepResponse(
      products,
      products.map((p) => p.id)
    )
  },
  async (ids: string[], { container }) => {
    if (!ids) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProducts(ids)
  }
)
