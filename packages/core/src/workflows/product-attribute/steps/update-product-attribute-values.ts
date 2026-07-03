import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  MercurModules,
  UpdateProductAttributeValueDTO,
  UpsertProductAttributeValueDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const updateProductAttributeValuesStepId =
  "pa-update-product-attribute-values"

export type UpdateProductAttributeValuesStepInput =
  | {
      selector: Record<string, unknown>
      update: UpdateProductAttributeValueDTO
    }
  | {
      values: UpsertProductAttributeValueDTO[]
    }

export const updateProductAttributeValuesStep = createStep(
  updateProductAttributeValuesStepId,
  async (data: UpdateProductAttributeValuesStepInput, { container }) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )

    if ("values" in data) {
      if (!data.values.length) {
        return new StepResponse([], [])
      }
      if (data.values.some((v) => !v.id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Value ID is required when doing a batch update of product attribute values",
        )
      }
      const prevValues = await service.listProductAttributeValues({
        id: data.values.map((v) => v.id) as string[],
      })
      const result = await service.updateProductAttributeValues(data.values)
      return new StepResponse(result, prevValues)
    }

    const { selector, update } = data
    const prevValues = await service.listProductAttributeValues(selector)
    const valuesToUpdate = prevValues.map((v) => ({
      id: v.id,
      ...update,
    }))
    const result = await service.updateProductAttributeValues(valuesToUpdate)
    return new StepResponse(result, prevValues)
  },
  async (prevValues: any[] | undefined, { container }) => {
    if (!prevValues?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.updateProductAttributeValues(
      prevValues.map((v) => ({ ...v })),
    )
  },
)
