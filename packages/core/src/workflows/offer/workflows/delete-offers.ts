import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData, LinkDefinition } from "@medusajs/framework/types"
import {
  dismissRemoteLinkStep,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules, OfferDTO } from "@mercurjs/types"

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

    const ownershipLinks = transform({ offers }, ({ offers }) => {
      const links: LinkDefinition[] = []
      for (const offer of offers) {
        links.push({
          [MercurModules.OFFER]: { offer_id: offer.id },
          [MercurModules.SELLER]: { seller_id: offer.seller_id },
        })
        if (offer.product_id) {
          links.push({
            [MercurModules.OFFER]: { offer_id: offer.id },
            [Modules.PRODUCT]: { product_id: offer.product_id },
          })
        }
      }
      return links
    })

    dismissRemoteLinkStep(ownershipLinks).config({
      name: "dismiss-offer-ownership-links",
    })

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
