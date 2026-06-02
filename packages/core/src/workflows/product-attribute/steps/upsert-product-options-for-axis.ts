import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type UpsertProductOptionsForAxisInput = Array<{
  product_id: string
  title: string
  values: string[]
}>

type Compensation = { created_ids: string[] }

export const upsertProductOptionsForAxisStepId =
  "pa-upsert-product-options-for-axis"


export const upsertProductOptionsForAxisStep = createStep(
  upsertProductOptionsForAxisStepId,
  async (input: UpsertProductOptionsForAxisInput, { container }) => {
    const valid = input.filter((e) => e.title && e.values.length)
    if (!valid.length) {
      return new StepResponse(undefined, { created_ids: [] })
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    const productIds = Array.from(new Set(valid.map((e) => e.product_id)))
    const titles = Array.from(new Set(valid.map((e) => e.title)))

    const existing = await service.listProductOptions(
      { product_id: productIds, title: titles },
      { relations: ["values"] },
    )

    const existingByKey = new Map<
      string,
      { id: string; title: string; values?: Array<{ value: string }> }
    >()
    for (const o of existing) {
      existingByKey.set(`${o.product_id}::${o.title}`, o)
    }

    const toCreate: Array<{
      title: string
      values: string[]
      product_id: string
    }> = []
    const toUpdate: Array<{
      id: string
      title: string
      values: string[]
      product_id: string
    }> = []

    for (const entry of valid) {
      const current = existingByKey.get(`${entry.product_id}::${entry.title}`)
      if (!current) {
        toCreate.push({
          title: entry.title,
          values: entry.values,
          product_id: entry.product_id,
        })
        continue
      }

      const currentValues = (current.values ?? []).map((v) => v.value)
      const currentSet = new Set(currentValues)
      const missing = entry.values.filter((v) => !currentSet.has(v))
      if (!missing.length) continue

      toUpdate.push({
        id: current.id,
        title: current.title,
        values: [...currentValues, ...missing],
        product_id: entry.product_id,
      })
    }

    const created = toCreate.length
      ? await service.createProductOptions(toCreate)
      : []
    if (toUpdate.length) {
      await service.upsertProductOptions(toUpdate)
    }

    return new StepResponse(undefined, {
      created_ids: created.map((o) => o.id),
    })
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation || !compensation.created_ids.length) return
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.deleteProductOptions(compensation.created_ids)
  },
)
