import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const createProductVariantAttributeValuesStepId =
  "pa-create-product-variant-attribute-values"

export type CreateProductVariantAttributeValuesStepInput = {
  variant_id: string
  value_id: string
}[]

export const createProductVariantAttributeValuesStep = createStep(
  createProductVariantAttributeValuesStepId,
  async (data: CreateProductVariantAttributeValuesStepInput, { container }) => {
    if (!data?.length) {
      return new StepResponse([], [])
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const rows = await service.createProductVariantAttributeValues(data)
    return new StepResponse(
      rows,
      rows.map((r) => r.id),
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.deleteProductVariantAttributeValues(ids)
  },
)
