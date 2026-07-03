import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductAttributeDTO, MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const createProductAttributesStepId = "pa-create-product-attributes"

// Excludes `values`: MedusaService treats it as a relation id-array, so values
// are written separately through `createProductAttributeValues`.
export type CreateProductAttributesStepInput = Omit<
  CreateProductAttributeDTO,
  "values"
>[]

export const createProductAttributesStep = createStep(
  createProductAttributesStepId,
  async (data: CreateProductAttributesStepInput, { container }) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const attributes = await service.createProductAttributes(data)
    return new StepResponse(
      attributes,
      attributes.map((a) => a.id),
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.deleteProductAttributes(ids)
  },
)
