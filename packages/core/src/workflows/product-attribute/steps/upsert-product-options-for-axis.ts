import { IProductModuleService, Query } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type UpsertProductOptionsForAxisInput = Array<{
  product_id: string
  title: string
  values: string[]
}>

type Compensation = { created_option_ids: string[] }

export const upsertProductOptionsForAxisStepId =
  "pa-upsert-product-options-for-axis"

/**
 * Ensures each (product, title) axis has a stock product option carrying the
 * requested values.
 *
 * Medusa 2.16 made product options global (`ProductOption` no longer has a
 * `product_id`; products link to options through a many-to-many pivot). A
 * per-product axis is therefore an **exclusive** option (`is_exclusive: true`)
 * attached to the single product via `addProductOptionToProduct`. Existing
 * options have any missing values appended in place.
 *
 * NOTE: this step is part of the legacy attribute→option shadow machinery that
 * SPEC-014 replaces; it is kept building against the 2.16 API only so the
 * package compiles during the migration.
 */
export const upsertProductOptionsForAxisStep = createStep(
  upsertProductOptionsForAxisStepId,
  async (input: UpsertProductOptionsForAxisInput, { container }) => {
    const valid = input.filter((e) => e.title && e.values.length)
    if (!valid.length) {
      return new StepResponse(undefined, { created_option_ids: [] })
    }

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    const productIds = Array.from(new Set(valid.map((e) => e.product_id)))

    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "options.id",
        "options.title",
        "options.values.id",
        "options.values.value",
      ],
      filters: { id: productIds },
    })

    const existingByKey = new Map<
      string,
      { id: string; values: Array<{ id: string; value: string }> }
    >()
    for (const p of products) {
      for (const o of p.options ?? []) {
        existingByKey.set(`${p.id}::${o.title}`, {
          id: o.id,
          values: (o.values ?? []).map((v: { id: string; value: string }) => ({
            id: v.id,
            value: v.value,
          })),
        })
      }
    }

    const createdOptionIds: string[] = []

    for (const entry of valid) {
      const current = existingByKey.get(`${entry.product_id}::${entry.title}`)

      if (!current) {
        const [created] = await service.createProductOptions([
          { title: entry.title, values: entry.values, is_exclusive: true },
        ])
        await service.addProductOptionToProduct([
          { product_option_id: created.id, product_id: entry.product_id },
        ])
        createdOptionIds.push(created.id)
        continue
      }

      const have = new Set(current.values.map((v) => v.value))
      const missing = entry.values.filter((v) => !have.has(v))
      if (!missing.length) continue

      await service.upsertProductOptions([
        {
          id: current.id,
          title: entry.title,
          values: [...current.values.map((v) => v.value), ...missing],
        },
      ])
    }

    return new StepResponse(undefined, { created_option_ids: createdOptionIds })
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation || !compensation.created_option_ids.length) return
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.deleteProductOptions(compensation.created_option_ids)
  },
)
