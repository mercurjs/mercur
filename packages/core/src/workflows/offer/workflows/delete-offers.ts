import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { OfferDTO } from "@mercurjs/types"

import { deleteOffersStep } from "../steps"
import { OfferWorkflowEvents } from "../../events"
import { OFFER_PRICE_FIELDS, pickOfferPrices } from "./upsert-offer-prices"

export type DeleteOffersWorkflowInput = { ids: string[] } & AdditionalData

export type DeleteOffersWorkflowHooks = [
  Hook<
    "offersDeleted",
    {
      ids: string[]
      offers: OfferDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const deleteOffersWorkflowId = "delete-offers"

export const deleteOffersWorkflow: ReturnWorkflow<
  DeleteOffersWorkflowInput,
  void,
  DeleteOffersWorkflowHooks
> = createWorkflow(
  deleteOffersWorkflowId,
  function (input: DeleteOffersWorkflowInput) {
    const { data: offers } = useQueryGraphStep({
      entity: "offer",
      fields: ["*", ...OFFER_PRICE_FIELDS],
      filters: { id: input.ids },
    })

    deleteOffersStep({ ids: input.ids })

    const eventData = transform({ offers }, ({ offers }) =>
      offers.map((o) => ({ id: o.id, product_id: o.product_id })),
    )

    emitEventStep({
      eventName: OfferWorkflowEvents.DELETED,
      data: eventData,
    })

    const deletedOffers = transform({ offers }, ({ offers }) =>
      (offers as unknown as OfferDTO[]).map((o) => ({
        ...o,
        prices: pickOfferPrices(o),
      })),
    )

    const offersDeleted = createHook("offersDeleted", {
      ids: input.ids,
      offers: deletedOffers,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, { hooks: [offersDeleted] })
  },
)
