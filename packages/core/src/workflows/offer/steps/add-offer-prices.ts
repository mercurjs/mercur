import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import type { AddPricesDTO } from "@medusajs/framework/types"

export type AddOfferPricesStepInput = AddPricesDTO[]

export type AddOfferPricesStepOutput = Array<{
  priceSetId: string
  prices: Array<{ id: string }>
}>

/**
 * Bulk-add prices to one or more shared variant PriceSets and return the
 * newly created Price IDs grouped by their input entry. Each entry's
 * `prices[]` rows MUST carry an `offer_id` PriceRule — the offer-write
 * workflow stamps it before dispatch so this step does not enforce it.
 *
 * Implementation detail: `pricingModule.addPrices` returns the full
 * PriceSet (existing + new rows). To isolate the new rows we snapshot
 * existing price IDs per `priceSetId` before the call and diff after.
 *
 * Compensation removes the created Price rows.
 */
export const addOfferPricesStepId = "add-offer-prices"

export const addOfferPricesStep = createStep(
  addOfferPricesStepId,
  async (data: AddOfferPricesStepInput, { container }) => {
    if (!data?.length) {
      return new StepResponse([] as AddOfferPricesStepOutput, [])
    }

    const pricingModule = container.resolve(Modules.PRICING)

    const uniquePriceSetIds = Array.from(
      new Set(data.map((d) => d.priceSetId)),
    )

    const existingSets = await pricingModule.listPriceSets(
      { id: uniquePriceSetIds },
      { relations: ["prices"] },
    )
    const existingIdsBySet = new Map<string, Set<string>>(
      existingSets.map((ps) => [
        ps.id,
        new Set((ps.prices ?? []).map((p) => p.id)),
      ]),
    )

    const updatedSets = await pricingModule.addPrices(data)

    const newPricesBySet = new Map<string, string[]>()
    for (const updated of updatedSets) {
      const before = existingIdsBySet.get(updated.id) ?? new Set<string>()
      const newPrices = (updated.prices ?? [])
        .map((p) => p.id)
        .filter((id) => !before.has(id))
      newPricesBySet.set(updated.id, newPrices)
    }

    // Distribute the new price IDs across input entries that share the
    // same priceSetId, preserving input order. Each entry consumes
    // `entry.prices.length` IDs from the per-set new-prices queue.
    const queueBySet = new Map<string, string[]>()
    for (const [setId, ids] of newPricesBySet) {
      queueBySet.set(setId, [...ids])
    }

    const output: AddOfferPricesStepOutput = data.map((entry) => {
      const queue = queueBySet.get(entry.priceSetId) ?? []
      const consumed = queue.splice(0, entry.prices.length)
      queueBySet.set(entry.priceSetId, queue)
      return {
        priceSetId: entry.priceSetId,
        prices: consumed.map((id) => ({ id })),
      }
    })

    const createdPriceIds = output.flatMap((entry) =>
      entry.prices.map((p) => p.id),
    )

    return new StepResponse(output, createdPriceIds)
  },
  async (createdPriceIds, { container }) => {
    if (!createdPriceIds?.length) {
      return
    }
    const pricingModule = container.resolve(Modules.PRICING)
    await pricingModule.removePrices(createdPriceIds)
  },
)
