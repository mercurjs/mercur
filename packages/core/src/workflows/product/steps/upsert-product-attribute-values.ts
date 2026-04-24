import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpsertProductAttributeValueDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

export type UpsertProductAttributeValuesStepInput = (UpsertProductAttributeValueDTO & {
  attribute_id?: string
})[]

export const upsertProductAttributeValuesStep = createStep(
  "upsert-product-attribute-values",
  async (data: UpsertProductAttributeValuesStepInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    const existingIds = data.filter((v) => v.id).map((v) => v.id!)
    const prevValues = existingIds.length
      ? await service.listProductAttributeValues({ id: existingIds })
      : []

    const result = await service.upsertProductAttributeValues(data)

    const createdIds = result
      .filter((v) => !existingIds.includes(v.id))
      .map((v) => v.id)

    return new StepResponse(
      result,
      { createdIds, prevValues }
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const { createdIds, prevValues } = compensationData

    if (createdIds?.length) {
      await service.deleteProductAttributeValues(createdIds)
    }

    if (prevValues?.length) {
      await service.updateProductAttributeValues(
        prevValues.map((v: any) => ({ ...v }))
      )
    }
  }
)
