import {
  createHook,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateOfferDTO, OfferDTO } from "@mercurjs/types"

import { updateOffersStep } from "../steps"
import { upsertOfferPricesWorkflow } from "./upsert-offer-prices"
import { OfferWorkflowEvents } from "../../events"

export type UpdateOffersWorkflowInput = {
  offers: UpdateOfferDTO[]
} & AdditionalData

export type UpdateOffersWorkflowHooks = [
  Hook<"validate", { input: UpdateOffersWorkflowInput }, unknown>,
  Hook<
    "offersUpdated",
    {
      offers: OfferDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateOffersWorkflowId = "update-offers"

export const updateOffersWorkflow: ReturnWorkflow<
  UpdateOffersWorkflowInput,
  OfferDTO[],
  UpdateOffersWorkflowHooks
> = createWorkflow(
  updateOffersWorkflowId,
  function (input: UpdateOffersWorkflowInput) {
    const validate = createHook("validate", { input })

    const rowUpdates = transform(input, ({ offers }) =>
      offers.map((o) => ({
        id: o.id,
        sku: o.sku,
        shipping_profile_id: o.shipping_profile_id,
        manage_inventory: o.manage_inventory,
        allow_backorder: o.allow_backorder,
        leadtime_to_ship: o.leadtime_to_ship,
        metadata: o.metadata,
      })),
    )

    const offers = updateOffersStep(rowUpdates)

    const offerPrices = transform({ input }, ({ input }) => ({
      offers: input.offers
        .filter((o) => Array.isArray(o.prices))
        .map((o) => ({ id: o.id, prices: o.prices ?? [] })),
    }))

    when({ offerPrices }, ({ offerPrices }) => offerPrices.offers.length > 0).then(
      () => {
        upsertOfferPricesWorkflow.runAsStep({ input: offerPrices })
      },
    )

    const eventData = transform({ offers }, ({ offers }) =>
      offers.map((o) => ({ id: o.id, product_id: o.product_id })),
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
  },
)
