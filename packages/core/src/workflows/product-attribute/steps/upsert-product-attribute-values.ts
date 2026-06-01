import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  CreateProductAttributeValueDTO,
  MercurModules,
  UpsertProductAttributeValueDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const upsertProductAttributeValuesStepId =
  "pa-upsert-product-attribute-values"

export type UpsertProductAttributeValuesStepInput =
  (UpsertProductAttributeValueDTO & {
    attribute_id?: string
  })[]

type UpsertCompensation = {
  createdIds: string[]
  prevValues: any[]
}

/**
 * Hand-rolled upsert: MedusaService autogenerates create/update/delete but not
 * upsert for the new `product-attribute` module. Split the input into
 * create rows (no `id`) and update rows (with `id`), call create / update
 * separately, and return the union. Compensation undoes both: delete the
 * created rows and restore the updated rows from captured `prevValues`.
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
      ? await service.listProductAttributeValues({
          id: updateRows.map((u) => u.id),
        })
      : []

    const created = createRows.length
      ? await service.createProductAttributeValues(createRows)
      : []

    const updated = updateRows.length
      ? await service.updateProductAttributeValues(updateRows)
      : []

    const compensation: UpsertCompensation = {
      createdIds: created.map((v) => v.id),
      prevValues,
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

    if (compensation.prevValues.length) {
      await service.updateProductAttributeValues(
        compensation.prevValues.map((v) => ({ ...v })),
      )
    }
  },
)
