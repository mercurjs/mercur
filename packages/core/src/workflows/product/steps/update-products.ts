import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { ProductDTO, UpdateProductDTO } from "@mercurjs/types"
import ProductModuleService from "../../../modules/product/service"

export type UpdateProductsStepInput =
  | {
    selector: Record<string, unknown>
    data: UpdateProductDTO
  }
  | {
    products: (UpdateProductDTO & { id: string })[]
  }

export const updateProductsStep = createStep(
  "update-products",
  async (input: UpdateProductsStepInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    if ("products" in input) {
      if (!input.products.length) {
        return new StepResponse<ProductDTO[], ProductDTO[]>([], [])
      }

      const prevProducts = await service.listProducts({
        id: input.products.map((p) => p.id),
      })

      const products = await service.updateProducts(input.products)
      return new StepResponse(products, prevProducts as any)
    }

    const prevProducts = await service.listProducts(input.selector)
    const productsToUpdate = prevProducts.map((p) => ({
      id: p.id,
      ...input.data,
    })) as (UpdateProductDTO & { id: string })[]
    const products = await service.updateProducts(productsToUpdate)

    const result = Array.isArray(products) ? products : [products]

    return new StepResponse(result, prevProducts)
  },
  async (prevProducts, { container }) => {
    if (!prevProducts?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProducts(
      prevProducts
    )
  }
)
