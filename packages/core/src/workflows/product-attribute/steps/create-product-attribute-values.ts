import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  CreateProductAttributeValueDTO,
  MercurModules,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const createProductAttributeValuesStepId =
  "pa-create-product-attribute-values"

type CreateProductAttributeValuesStepInput = (CreateProductAttributeValueDTO & {
  attribute_id: string
})[]

export const createProductAttributeValuesStep = createStep(
  createProductAttributeValuesStepId,
  async (data: CreateProductAttributeValuesStepInput, { container }) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const values = await service.createProductAttributeValues(data)
    return new StepResponse(
      values,
      values.map((v) => v.id),
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.deleteProductAttributeValues(ids)
  },
)
