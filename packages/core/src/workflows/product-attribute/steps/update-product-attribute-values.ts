import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  MercurModules,
  UpdateProductAttributeValueDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../_step5-pending/modules/product-attribute/service"

export const updateProductAttributeValuesStepId =
  "pa-update-product-attribute-values"

type UpdateProductAttributeValuesStepInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeValueDTO
}

type PrevAttributeValueScalar = {
  id: string
  handle?: string | null
  name?: string
  rank?: number
  is_active?: boolean
  metadata?: Record<string, unknown> | null
  attribute_id?: string
}

const pickValueScalars = (
  v: Record<string, unknown> & { id: string },
): PrevAttributeValueScalar => ({
  id: v.id,
  handle: v.handle as string | null | undefined,
  name: v.name as string | undefined,
  rank: v.rank as number | undefined,
  is_active: v.is_active as boolean | undefined,
  metadata: v.metadata as Record<string, unknown> | null | undefined,
  attribute_id: v.attribute_id as string | undefined,
})

export const updateProductAttributeValuesStep = createStep(
  updateProductAttributeValuesStepId,
  async (
    { selector, update }: UpdateProductAttributeValuesStepInput,
    { container },
  ) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const prevValues = (await service.listProductAttributeValues(
      selector,
    )) as Array<Record<string, unknown> & { id: string }>

    const prevScalars = prevValues.map(pickValueScalars)

    const valuesToUpdate = prevScalars.map((v) => ({
      ...v,
      ...update,
    }))
    const result = await service.updateProductAttributeValues(valuesToUpdate)
    return new StepResponse(result, prevScalars)
  },
  async (
    prevScalars: PrevAttributeValueScalar[] | undefined,
    { container },
  ) => {
    if (!prevScalars?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.updateProductAttributeValues(prevScalars)
  },
)
