import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type RemoveOfferPricesStepInput = string[]

export const removeOfferPricesStepId = "remove-offer-prices"

export const removeOfferPricesStep = createStep(
  removeOfferPricesStepId,
  async (ids: RemoveOfferPricesStepInput, { container }) => {
    if (!ids?.length) {
      return new StepResponse(void 0)
    }
    const pricingModule = container.resolve(Modules.PRICING)
    await pricingModule.removePrices(ids)
    return new StepResponse(void 0)
  },
)
