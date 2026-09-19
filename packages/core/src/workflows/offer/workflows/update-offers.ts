import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  AdditionalData,
  LinkDefinition,
  PricingTypes,
} from "@medusajs/framework/types"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { UpdateOfferDTO, MercurModules, OfferDTO } from "@mercurjs/types"

import {
  addOfferPricesStep,
  removeOfferPricesStep,
  updateOffersStep,
  type AddOfferPricesStepInput,
} from "../steps"
import { assertOfferPriceOwnership } from "../utils"
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

    const offersWithPriceUpdates = transform({ input }, ({ input }) =>
      input.offers
        .filter((o) => Array.isArray(o.prices))
        .map((o) => o.id),
    )

    const { data: offerRows } = useQueryGraphStep({
      entity: "offer",
      fields: [
        "id",
        "variant_id",
        "product_variant.price_set.id",
        "prices.id",
        "prices.amount",
        "prices.currency_code",
        "prices.min_quantity",
        "prices.max_quantity",
        "prices.price_rules.attribute",
        "prices.price_rules.value",
      ],
      filters: { id: offersWithPriceUpdates },
    }).config({ name: "get-offer-prices" })

    const pricingDiff = transform(
      { input, offerRows },
      ({ input, offerRows }) => {
        const offerById = new Map(
          (offerRows as Array<{
            id: string
            variant_id: string
            product_variant?: {
              price_set?: { id?: string } | null
            } | null
            prices?: Array<{ id: string } | null> | null
          }>).map((o) => [o.id, o]),
        )

        const addPricesPayload: AddOfferPricesStepInput = []
        const toRemoveIds: string[] = []
        const removedLinks: LinkDefinition[] = []

        for (const offer of input.offers) {
          if (!Array.isArray(offer.prices)) {
            continue
          }
          const loaded = offerById.get(offer.id)
          if (!loaded) {
            throw new MedusaError(
              MedusaError.Types.NOT_FOUND,
              `Offer ${offer.id} was not found`,
            )
          }
          const priceSetId = loaded.product_variant?.price_set?.id
          if (!priceSetId) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Variant ${loaded.variant_id} has no PriceSet`,
            )
          }

          // `prices` comes through the offer <-> price link, so a link row
          // whose price no longer resolves yields a null element. Such a
          // dangling link takes no part in the diff.
          const ownedIds = new Set(
            (loaded.prices ?? [])
              .filter((p): p is { id: string } => !!p?.id)
              .map((p) => p.id),
          )
          const incomingIds = offer.prices
            .map((p) => p.id)
            .filter((id): id is string => !!id)

          assertOfferPriceOwnership({
            offer_id: offer.id,
            price_ids: incomingIds,
            owned_price_ids: ownedIds,
          })

          const keepIds = new Set(incomingIds)
          for (const ownedId of ownedIds) {
            if (!keepIds.has(ownedId)) {
              toRemoveIds.push(ownedId)
              removedLinks.push({
                [MercurModules.OFFER]: { offer_id: offer.id },
                [Modules.PRICING]: { price_id: ownedId },
              })
            }
          }

          const upsertPrices: Array<
            PricingTypes.CreatePricesDTO & { id?: string }
          > = offer.prices.map((p) => {
            const base: PricingTypes.CreatePricesDTO & { id?: string } = {
              amount: p.amount,
              currency_code: p.currency_code,
              rules: { ...(p.rules ?? {}), offer_id: offer.id },
            }
            if (p.id) {
              base.id = p.id
            }
            if (p.min_quantity !== undefined && p.min_quantity !== null) {
              base.min_quantity = p.min_quantity
            }
            if (p.max_quantity !== undefined && p.max_quantity !== null) {
              base.max_quantity = p.max_quantity
            }
            return base
          })

          if (upsertPrices.length) {
            addPricesPayload.push({
              priceSetId,
              prices: upsertPrices,
            })
          }
        }

        return {
          addPricesPayload,
          toRemoveIds,
          removedLinks,
        }
      },
    )

    const toRemoveIds = transform(
      { pricingDiff },
      ({ pricingDiff }) => pricingDiff.toRemoveIds,
    )

    const removedLinks = transform(
      { pricingDiff },
      ({ pricingDiff }) => pricingDiff.removedLinks,
    )
    // Dismiss the links before deleting the prices: a failure between the two
    // then leaves an orphaned price rather than a dangling link, which would
    // make the offer permanently unupdatable.
    dismissRemoteLinkStep(removedLinks).config({
      name: "dismiss-removed-offer-price-links",
    })

    removeOfferPricesStep(toRemoveIds)

    const addPricesPayload = transform(
      { pricingDiff },
      ({ pricingDiff }) => pricingDiff.addPricesPayload,
    )

    const addedPrices = addOfferPricesStep(addPricesPayload)

    const newLinks = transform(
      { addedPrices },
      ({ addedPrices }) => {
        const links: LinkDefinition[] = []
        for (const entry of addedPrices) {
          for (const priceId of entry.price_ids) {
            links.push({
              [MercurModules.OFFER]: { offer_id: entry.offer_id },
              [Modules.PRICING]: { price_id: priceId },
            })
          }
        }
        return links
      },
    )

    createRemoteLinkStep(newLinks).config({
      name: "create-new-offer-price-links",
    })

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
