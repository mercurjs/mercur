import { BigNumberInput, PricingContext } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type CalculateOfferPricesInput = {
  context: PricingContext["context"]
  items: Array<{
    offer_id: string
    quantity: BigNumberInput
  }>
  offers: Array<{
    id: string
    price_set_id: string
  }>
}

export type CalculateOfferPricesOutput = Array<{
  offer_id: string
  unit_price: number
  currency_code: string
}>

export const calculateOfferPricesStepId = "calculate-offer-prices"

export const calculateOfferPricesStep = createStep(
  calculateOfferPricesStepId,
  async (input: CalculateOfferPricesInput, { container }) => {
    if (!input.items?.length) {
      return new StepResponse([], null)
    }

    const offerById = new Map(input.offers.map((o) => [o.id, o]))

    const priceSetIds: string[] = []
    for (const item of input.items) {
      const offer = offerById.get(item.offer_id)
      if (!offer) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Offer ${item.offer_id} not found`,
        )
      }
      priceSetIds.push(offer.price_set_id)
    }

    const pricingModule = container.resolve(Modules.PRICING)

    const calculated = await pricingModule.calculatePrices(
      { id: priceSetIds },
      { context: input.context },
    )

    const calculatedByPriceSet = new Map(
      calculated.map((row) => [row.id, row]),
    )

    const result: CalculateOfferPricesOutput = input.items.map((item) => {
      const offer = offerById.get(item.offer_id)!
      const calc = calculatedByPriceSet.get(offer.price_set_id)
      if (
        !calc ||
        calc.calculated_amount === null ||
        calc.calculated_amount === undefined
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Could not resolve a calculated price for offer ${item.offer_id} in the current pricing context`,
        )
      }
      return {
        offer_id: item.offer_id,
        unit_price: calc.calculated_amount as number,
        currency_code: (calc.currency_code as string) ?? "",
      }
    })

    return new StepResponse(result, null)
  },
)
