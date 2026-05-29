import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdateProductAttributeDTO } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../_step5-pending/modules/product-attribute/service"

export const updateProductAttributesStepId = "pa-update-product-attributes"

type UpdateProductAttributesStepInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeDTO
}

type PrevAttributeScalar = {
  id: string
  handle?: string | null
  name?: string
  description?: string | null
  type?: UpdateProductAttributeDTO["type"]
  is_required?: boolean
  is_filterable?: boolean
  is_variant_axis?: boolean
  rank?: number
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

const pickAttributeScalars = (
  a: Record<string, unknown> & { id: string },
): PrevAttributeScalar => ({
  id: a.id,
  handle: a.handle as string | null | undefined,
  name: a.name as string | undefined,
  description: a.description as string | null | undefined,
  type: a.type as UpdateProductAttributeDTO["type"],
  is_required: a.is_required as boolean | undefined,
  is_filterable: a.is_filterable as boolean | undefined,
  is_variant_axis: a.is_variant_axis as boolean | undefined,
  rank: a.rank as number | undefined,
  is_active: a.is_active as boolean | undefined,
  metadata: a.metadata as Record<string, unknown> | null | undefined,
})

export const updateProductAttributesStep = createStep(
  updateProductAttributesStepId,
  async (
    { selector, update }: UpdateProductAttributesStepInput,
    { container },
  ) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const prevAttributes = (await service.listProductAttributes(
      selector,
    )) as Array<Record<string, unknown> & { id: string }>

    const prevScalars = prevAttributes.map(pickAttributeScalars)

    const attributesToUpdate = prevScalars.map((a) => ({
      ...a,
      ...update,
    }))
    const attributes = await service.updateProductAttributes(attributesToUpdate)
    return new StepResponse(attributes, prevScalars)
  },
  async (
    prevScalars: PrevAttributeScalar[] | undefined,
    { container },
  ) => {
    if (!prevScalars?.length) {
      return
    }
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.updateProductAttributes(prevScalars)
  },
)
