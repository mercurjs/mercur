import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductAttributeDTO, MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../_step5-pending/modules/product-attribute/service"

export const createProductAttributesStepId = "pa-create-product-attributes"

/**
 * Scalar create input. Excludes `values` and `product_id` because:
 * - `values` is now a separate write through `createProductAttributeValues`
 *   (the new module's MedusaService treats `values` as a relation id-array,
 *   not nested object input).
 * - `product_id` is the legacy fused-module column being dropped (SPEC-008,
 *   Pass C of the data migration moves those rows to stock ProductOption).
 */
export type CreateProductAttributesStepInput = Omit<
  CreateProductAttributeDTO,
  "values" | "product_id"
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
