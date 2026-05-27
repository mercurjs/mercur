import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type EnsureVariantPriceSetsInput = {
  variant_ids: string[]
}

export type EnsureVariantPriceSetsOutput = Record<string, string>

/**
 * Resolves `variant_id → price_set_id` for every requested variant. If a
 * variant has no `price_set` link yet, creates an empty `PriceSet` and
 * registers the `variant ↔ price_set` link in the same call.
 *
 * Compensation deletes any PriceSet rows that were materialised inside
 * this step so the workflow can roll back without leaking marketplace-virgin
 * PriceSets.
 */
export const ensureVariantPriceSetsStepId = "ensure-variant-price-sets"

export const ensureVariantPriceSetsStep = createStep(
  ensureVariantPriceSetsStepId,
  async (input: EnsureVariantPriceSetsInput, { container }) => {
    const variantIds = Array.from(new Set(input.variant_ids ?? []))
    if (!variantIds.length) {
      return new StepResponse({}, [])
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const pricingModule = container.resolve(Modules.PRICING)

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "price_set.id"],
      filters: { id: variantIds },
    })

    const result: EnsureVariantPriceSetsOutput = {}
    const missing: string[] = []
    for (const variant of variants as Array<{
      id: string
      price_set?: { id?: string } | null
    }>) {
      const priceSetId = variant.price_set?.id
      if (priceSetId) {
        result[variant.id] = priceSetId
      } else {
        missing.push(variant.id)
      }
    }

    const createdPriceSetIds: string[] = []
    if (missing.length) {
      const created = await pricingModule.createPriceSets(
        missing.map(() => ({ prices: [] })),
      )
      const linksToCreate = missing.map((variantId, idx) => ({
        [Modules.PRODUCT]: { variant_id: variantId },
        [Modules.PRICING]: { price_set_id: created[idx].id },
      }))
      await link.create(linksToCreate)
      missing.forEach((variantId, idx) => {
        result[variantId] = created[idx].id
        createdPriceSetIds.push(created[idx].id)
      })
    }

    return new StepResponse(result, createdPriceSetIds)
  },
  async (createdPriceSetIds, { container }) => {
    if (!createdPriceSetIds?.length) {
      return
    }
    const pricingModule = container.resolve(Modules.PRICING)
    await pricingModule.deletePriceSets(createdPriceSetIds)
  },
)
