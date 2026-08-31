import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import type { AddPricesDTO } from "@medusajs/framework/types"

export type AddOfferPricesStepInput = AddPricesDTO[]

export type AddOfferPricesStepOutput = Array<{
  offer_id: string
  price_ids: string[]
}>

export const addOfferPricesStepId = "add-offer-prices"

export const addOfferPricesStep = createStep(
  addOfferPricesStepId,
  async (data: AddOfferPricesStepInput, { container }) => {
    if (!data?.length) {
      return new StepResponse([] as AddOfferPricesStepOutput, [])
    }

    const pricingModule = container.resolve(Modules.PRICING)

    const uniquePriceSetIds = Array.from(new Set(data.map((d) => d.priceSetId)))

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

    const newPriceIds: string[] = []
    for (const updated of updatedSets) {
      const before = existingIdsBySet.get(updated.id) ?? new Set<string>()
      for (const price of updated.prices ?? []) {
        if (!before.has(price.id)) {
          newPriceIds.push(price.id)
        }
      }
    }

    // Attribute each new price to its offer through the `offer_id` price rule
    // written in the payload, not by position: a single price set can receive
    // prices from several offers in one call, and the order `addPrices` returns
    // them in is not guaranteed to match the input order.
    const createdPrices = newPriceIds.length
      ? await pricingModule.listPrices(
          { id: newPriceIds },
          { relations: ["price_rules"] },
        )
      : []

    const priceIdsByOffer = new Map<string, string[]>()
    for (const price of createdPrices) {
      const rules =
        (
          price as {
            price_rules?: Array<{ attribute: string; value: string }>
          }
        ).price_rules ?? []
      const offerId = rules.find((r) => r.attribute === "offer_id")?.value
      if (!offerId) {
        continue
      }
      const bucket = priceIdsByOffer.get(offerId) ?? []
      bucket.push(price.id)
      priceIdsByOffer.set(offerId, bucket)
    }

    const output: AddOfferPricesStepOutput = Array.from(
      priceIdsByOffer.entries(),
    ).map(([offer_id, price_ids]) => ({ offer_id, price_ids }))

    return new StepResponse(output, newPriceIds)
  },
  async (createdPriceIds, { container }) => {
    if (!createdPriceIds?.length) {
      return
    }
    const pricingModule = container.resolve(Modules.PRICING)
    await pricingModule.removePrices(createdPriceIds)
  },
)
