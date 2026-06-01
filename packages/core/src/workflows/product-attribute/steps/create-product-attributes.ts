import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductAttributeDTO, MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const createProductAttributesStepId = "pa-create-product-attributes"

/**
 * Scalar create input. Excludes `values` because the new module's
 * MedusaService treats `values` as a relation id-array — values are
 * written separately through `createProductAttributeValues`.
 *
 * `product_id` IS kept: it scopes the attribute to a single product so
 * inline-custom attributes (created from the product create form) are
 * hidden from the global /product-attributes catalogue. `null` =
 * global attribute.
 */
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
