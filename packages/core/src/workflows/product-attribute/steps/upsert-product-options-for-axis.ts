import { IProductModuleService, ProductOptionDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type UpsertProductOptionsForAxisInput = Array<{
  product_id: string
  title: string
  values: string[]
}>

type Compensation = {
  created_option_ids: string[]
  attached: { product_id: string; product_option_id: string }[]
}

export const upsertProductOptionsForAxisStepId =
  "pa-upsert-product-options-for-axis"

/**
 * Ensures each `(product_id, title)` entry maps to a product option titled
 * `title` whose value set covers `values`.
 *
 * Since Medusa 2.16 (global product options) options are no longer owned by
 * a product via `product_id`; they are global rows attached to products
 * through a pivot. To preserve the previous per-product behaviour each
 * synthesised axis option is created as **exclusive** (`is_exclusive: true`)
 * and attached to the single owning product. Variant-axis attributes that
 * should be reused across products are handled by the higher-level
 * attribute↔option linking, not this low-level synthesis step.
 */
export const upsertProductOptionsForAxisStep = createStep(
  upsertProductOptionsForAxisStepId,
  async (input: UpsertProductOptionsForAxisInput, { container }) => {
    const valid = input.filter((e) => e.title && e.values.length)
    if (!valid.length) {
      return new StepResponse(undefined, {
        created_option_ids: [],
        attached: [],
      })
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    const productIds = Array.from(new Set(valid.map((e) => e.product_id)))

    // Load each product's currently attached options + their values so we
    // can decide between attaching a fresh option and extending an existing
    // one's value set.
    const products = await service.listProducts(
      { id: productIds },
      { relations: ["options", "options.values"] },
    )
    const optionsByProduct = new Map<string, ProductOptionDTO[]>()
    for (const p of products) {
      optionsByProduct.set(p.id, (p.options ?? []) as ProductOptionDTO[])
    }

    const created_option_ids: string[] = []
    const attached: { product_id: string; product_option_id: string }[] = []

    for (const entry of valid) {
      const attachedOptions = optionsByProduct.get(entry.product_id) ?? []
      const existing = attachedOptions.find((o) => o.title === entry.title)

      if (!existing) {
        const [created] = await service.createProductOptions([
          { title: entry.title, values: entry.values, is_exclusive: true },
        ])
        await service.addProductOptionToProduct({
          product_option_id: created.id,
          product_id: entry.product_id,
        })
        created_option_ids.push(created.id)
        attached.push({
          product_id: entry.product_id,
          product_option_id: created.id,
        })
        // Keep the local cache coherent for repeated titles in this batch.
        attachedOptions.push(created as ProductOptionDTO)
        optionsByProduct.set(entry.product_id, attachedOptions)
        continue
      }

      const currentValues = new Set(
        (existing.values ?? []).map((v) => v.value),
      )
      const missing = entry.values.filter((v) => !currentValues.has(v))
      if (!missing.length) continue

      await service.updateProductOptionValuesOnProduct({
        product_option_id: existing.id,
        product_id: entry.product_id,
        add: missing.map((value) => ({ value })),
      })
      existing.values = [
        ...(existing.values ?? []),
        ...missing.map((value) => ({ value }) as ProductOptionDTO["values"][number]),
      ]
    }

    return new StepResponse(undefined, { created_option_ids, attached })
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation) return
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    if (compensation.attached.length) {
      await service.removeProductOptionFromProduct(
        compensation.attached.map((a) => ({
          product_option_id: a.product_option_id,
          product_id: a.product_id,
        })),
      )
    }
    if (compensation.created_option_ids.length) {
      await service.deleteProductOptions(compensation.created_option_ids)
    }
  },
)
