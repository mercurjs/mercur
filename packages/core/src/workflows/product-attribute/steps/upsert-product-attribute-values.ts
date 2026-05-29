import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  CreateProductAttributeValueDTO,
  MercurModules,
  UpsertProductAttributeValueDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../_step5-pending/modules/product-attribute/service"

export const upsertProductAttributeValuesStepId =
  "pa-upsert-product-attribute-values"

export type UpsertProductAttributeValuesStepInput =
  (UpsertProductAttributeValueDTO & {
    attribute_id?: string
  })[]

type PrevValueScalar = {
  id: string
  handle?: string | null
  name?: string
  rank?: number
  is_active?: boolean
  metadata?: Record<string, unknown> | null
  attribute_id?: string
}

type UpsertCompensation = {
  createdIds: string[]
  prevScalars: PrevValueScalar[]
}

const pickValueScalars = (
  v: Record<string, unknown> & { id: string },
): PrevValueScalar => ({
  id: v.id,
  handle: v.handle as string | null | undefined,
  name: v.name as string | undefined,
  rank: v.rank as number | undefined,
  is_active: v.is_active as boolean | undefined,
  metadata: v.metadata as Record<string, unknown> | null | undefined,
  attribute_id: v.attribute_id as string | undefined,
})

/**
 * Hand-rolled upsert: MedusaService autogenerates create/update/delete but not
 * upsert for the new `product-attribute` module. Split the input into
 * create rows (no `id`) and update rows (with `id`), call create / update
 * separately, and return the union. Compensation undoes both: delete the
 * created rows and restore the updated rows from captured scalars.
 */
export const upsertProductAttributeValuesStep = createStep(
  upsertProductAttributeValuesStepId,
  async (data: UpsertProductAttributeValuesStepInput, { container }) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )

    const updateRows = data.filter(
      (v): v is UpsertProductAttributeValueDTO & { id: string } =>
        typeof v.id === "string" && v.id.length > 0,
    )
    const createRows = data
      .filter((v) => !v.id)
      .map((v) => {
        const { id: _id, ...rest } = v
        return rest as CreateProductAttributeValueDTO & { attribute_id: string }
      })

    const prevValues = updateRows.length
      ? ((await service.listProductAttributeValues({
          id: updateRows.map((u) => u.id),
        })) as Array<Record<string, unknown> & { id: string }>)
      : []
    const prevScalars = prevValues.map(pickValueScalars)

    const created = createRows.length
      ? await service.createProductAttributeValues(createRows)
      : []

    const updated = updateRows.length
      ? await service.updateProductAttributeValues(updateRows)
      : []

    const compensation: UpsertCompensation = {
      createdIds: created.map((v) => v.id),
      prevScalars,
    }

    return new StepResponse([...created, ...updated], compensation)
  },
  async (compensation: UpsertCompensation | undefined, { container }) => {
    if (!compensation) {
      return
    }

    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )

    if (compensation.createdIds.length) {
      await service.deleteProductAttributeValues(compensation.createdIds)
    }

    if (compensation.prevScalars.length) {
      await service.updateProductAttributeValues(compensation.prevScalars)
    }
  },
)
