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
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { UpdateOfferDTO, OfferDTO } from "@mercurjs/types"

import {
  resolveOfferShippingProfilesStep,
  updateOffersStep,
  validateOfferConditionsStep,
} from "../steps"
import { upsertOfferPricesWorkflow } from "./upsert-offer-prices"
import { OfferWorkflowEvents } from "../../events"
import { validateSellerMandatoryShippingRulesStep } from "../../shipping-rule/steps"

export type UpdateOffersWorkflowInput = {
  offers: UpdateOfferDTO[]
  updated_by?: string
} & AdditionalData

export type UpdateOffersWorkflowHooks = [
  Hook<"validate", { input: UpdateOffersWorkflowInput }, unknown>,
  Hook<
    "offersUpdated",
    {
      offers: OfferDTO[]
      previous_offers: OfferDTO[]
      updated_by: string | undefined
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

    const conditionIds = transform(input, ({ offers }) =>
      offers
        .map((o) => o.condition_id)
        .filter((id): id is string => !!id),
    )

    validateOfferConditionsStep({ condition_ids: conditionIds })

    const offerIds = transform(input, ({ offers }) => offers.map((o) => o.id))

    const { data: previousOffers } = useQueryGraphStep({
      entity: "offer",
      fields: ["*"],
      filters: { id: offerIds },
    }).config({ name: "get-offers-before-update" })

    const resetOffers = transform(
      { input, previousOffers },
      ({ input, previousOffers }) => {
        const previousById = new Map(
          (previousOffers as { id: string; variant_id: string }[]).map(
            (offer) => [offer.id, offer],
          ),
        )
        return input.offers
          .filter((o) => o.shipping_profile_id === null && previousById.has(o.id))
          .map((o) => ({ id: o.id, variant_id: previousById.get(o.id)!.variant_id }))
      },
    )

    const resetProfileIds = when(
      "reset-offer-shipping-profiles",
      { resetOffers },
      ({ resetOffers }) => resetOffers.length > 0,
    ).then(() => {
      const { data: resetVariants } = useQueryGraphStep({
        entity: "product_variant",
        fields: ["id", "product.id"],
        filters: {
          id: transform({ resetOffers }, ({ resetOffers }) =>
            resetOffers.map((o) => o.variant_id),
          ),
        },
      }).config({ name: "get-reset-offer-variants" })

      return resolveOfferShippingProfilesStep({
        offers: transform({ resetOffers }, ({ resetOffers }) =>
          resetOffers.map((o) => ({ variant_id: o.variant_id })),
        ),
        variants: resetVariants,
      }).config({ name: "resolve-reset-offer-shipping-profiles" })
    })

    const nextProfileById = transform(
      { input, resetOffers, resetProfileIds },
      ({ input, resetOffers, resetProfileIds }) => {
        const next: Record<string, string> = {}
        resetOffers.forEach((o, idx) => {
          const resolved = resetProfileIds?.[idx]
          if (resolved) {
            next[o.id] = resolved
          }
        })
        for (const o of input.offers) {
          if (o.shipping_profile_id) {
            next[o.id] = o.shipping_profile_id
          }
        }
        return next
      },
    )

    validateSellerMandatoryShippingRulesStep({
      sellers: transform(
        { nextProfileById, previousOffers },
        ({ nextProfileById, previousOffers }) => {
          const bySeller = new Map<string, string[]>()
          for (const previous of previousOffers as {
            id: string
            seller_id: string
            shipping_profile_id: string
          }[]) {
            const next = nextProfileById[previous.id]
            if (!next || next === previous.shipping_profile_id) {
              continue
            }
            const profiles = bySeller.get(previous.seller_id) ?? []
            profiles.push(next)
            bySeller.set(previous.seller_id, profiles)
          }
          return Array.from(bySeller, ([seller_id, shipping_profile_ids]) => ({
            seller_id,
            shipping_profile_ids,
          }))
        },
      ),
    })

    const rowUpdates = transform({ input, nextProfileById }, ({ input, nextProfileById }) =>
      input.offers.map((o) => ({
        id: o.id,
        sku: o.sku,
        shipping_profile_id: nextProfileById[o.id],
        manage_inventory: o.manage_inventory,
        allow_backorder: o.allow_backorder,
        leadtime_to_ship: o.leadtime_to_ship,
        condition_id: o.condition_id,
        metadata: o.metadata,
      })),
    )

    const offers = updateOffersStep(rowUpdates)

    const offerPrices = transform({ input }, ({ input }) => ({
      offers: input.offers
        .filter((o) => Array.isArray(o.prices))
        .map((o) => ({ id: o.id, prices: o.prices ?? [] })),
      updated_by: input.updated_by,
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
      previous_offers: previousOffers as unknown as OfferDTO[],
      updated_by: input.updated_by,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(offers, {
      hooks: [validate, offersUpdated],
    })
  },
)
