import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type RemoveOfferPricesStepInput = string[]

export const removeOfferPricesStepId = "remove-offer-prices"

/**
 * Bulk-remove Price rows. Used by `updateOffersWorkflow` to delete the
 * obsolete rows for an offer's diff, and by `deleteOffersWorkflow` (hard
 * delete branch) to drop every offer-owned row.
 *
 * No compensation: caller is responsible for repopulating prices on
 * rollback via the surrounding workflow's transaction model.
 */
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
