import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData, PricingTypes } from "@medusajs/framework/types"
import {
  emitEventStep,
  updatePriceSetsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import { UpdateOfferDTO } from "@mercurjs/types"

import { updateOffersStep } from "../steps"
import { OfferWorkflowEvents } from "../../events"

/**
 * Setting `prices` on an entry rewrites the offer's `PriceSet` with replace
 * semantics (mirroring Medusa's `updateProductVariantsWorkflow` →
 * `updatePriceSetsStep`): rows with `id` are updated, rows without `id` are
 * added, and any existing price absent from the array is removed. Omit the
 * field to leave prices untouched.
 */
export type UpdateOffersWorkflowInput = {
  offers: UpdateOfferDTO[]
} & AdditionalData

export const updateOffersWorkflowId = "update-offers"

export const updateOffersWorkflow = createWorkflow(
  updateOffersWorkflowId,
  function (input: UpdateOffersWorkflowInput) {
    const validate = createHook("validate", { input })

    const rowUpdates = transform(input, ({ offers }) =>
      offers.map((o) => ({
        id: o.id,
        sku: o.sku,
        shipping_profile_id: o.shipping_profile_id,
        metadata: o.metadata,
      }))
    )

    const offers = updateOffersStep(rowUpdates)

    const ids = transform({ input }, ({ input }) =>
      input.offers
        .filter((o) => Array.isArray(o.prices))
        .map((o) => o.id)
    )

    const { data: offerRows } = useQueryGraphStep({
      entity: "offer",
      fields: ["id", "price_set_id"],
      filters: { id: ids },
    }).config({ name: "get-offer-price-sets" })

    const priceSetsToUpdate = transform(
      { input, offerRows },
      ({ input, offerRows }) => {
        const byId = new Map(offerRows.map((o) => [o.id, o.price_set_id]))
        const price_sets: PricingTypes.UpsertPriceSetDTO[] = []

        for (const offer of input.offers) {
          if (!Array.isArray(offer.prices)) {
            continue
          }
          const priceSetId = byId.get(offer.id)
          if (!priceSetId) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Offer ${offer.id} has no price set`
            )
          }
          price_sets.push({
            id: priceSetId,
            prices: offer.prices.map((p) => ({
              ...(p.id ? { id: p.id } : {}),
              amount: p.amount,
              currency_code: p.currency_code,
              min_quantity: p.min_quantity ?? undefined,
              max_quantity: p.max_quantity ?? undefined,
              rules: p.rules ?? {},
            })),
          })
        }

        return { price_sets }
      }
    )

    updatePriceSetsStep(priceSetsToUpdate)

    const eventData = transform({ offers }, ({ offers }) =>
      offers.map((o) => ({ id: o.id }))
    )

    emitEventStep({
      eventName: OfferWorkflowEvents.UPDATED,
      data: eventData,
    })

    const offersUpdated = createHook("offersUpdated", {
      offers,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(offers, {
      hooks: [validate, offersUpdated],
    })
  }
)
