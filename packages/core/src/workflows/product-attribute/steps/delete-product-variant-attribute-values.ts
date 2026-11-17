import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const deleteProductVariantAttributeValuesStepId =
  "pa-delete-product-variant-attribute-values"

export const deleteProductVariantAttributeValuesStep = createStep(
  deleteProductVariantAttributeValuesStepId,
  async (ids: string[], { container }) => {
    if (!ids?.length) {
      return new StepResponse(void 0, [])
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.softDeleteProductVariantAttributeValues(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.restoreProductVariantAttributeValues(ids)
  },
)
