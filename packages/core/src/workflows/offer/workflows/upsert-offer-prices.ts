import {
  createHook,
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { LinkDefinition, PricingTypes } from "@medusajs/framework/types"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  MercurModules,
  OfferPriceDTO,
  UpsertOfferPriceDTO,
} from "@mercurjs/types"

import {
  addOfferPricesStep,
  removeOfferPricesStep,
  type AddOfferPricesStepInput,
  type AddOfferPricesStepOutput,
} from "../steps"
import { assertOfferPriceOwnership } from "../utils"

export type UpsertOfferPricesWorkflowInput = {
  offers: {
    id: string
    prices: UpsertOfferPriceDTO[]
  }[]
  updated_by?: string
}

export type OfferPricesUpsertedHookOffer = {
  offer_id: string
  previous_prices: OfferPriceDTO[]
  prices: OfferPriceDTO[]
  created: string[]
  updated: string[]
  deleted: string[]
}

export type UpsertOfferPricesWorkflowHooks = [
  Hook<
    "offerPricesUpserted",
    {
      offers: OfferPricesUpsertedHookOffer[]
      updated_by: string | null
    },
    unknown
  >,
]

export const OFFER_PRICE_FIELDS = [
  "prices.id",
  "prices.amount",
  "prices.currency_code",
  "prices.min_quantity",
  "prices.max_quantity",
  "prices.price_rules.attribute",
  "prices.price_rules.value",
] as const

type LoadedOfferPrices = {
  id: string
  prices?: Array<OfferPriceDTO | null> | null
}

export const pickOfferPrices = (offer: LoadedOfferPrices): OfferPriceDTO[] =>
  (offer.prices ?? []).filter((p): p is OfferPriceDTO => !!p?.id)

const serializePrice = (
  amount: unknown,
  min_quantity: unknown,
  max_quantity: unknown,
  rules: Array<{ attribute: string; value: string }>,
) =>
  JSON.stringify({
    amount: Number(amount),
    min_quantity: min_quantity ?? null,
    max_quantity: max_quantity ?? null,
    rules: [...rules].sort((a, b) =>
      `${a.attribute}=${a.value}`.localeCompare(`${b.attribute}=${b.value}`),
    ),
  })

export const upsertOfferPricesWorkflowId = "upsert-offer-prices"

/**
 * Replaces each offer's own prices. Offers on the same variant share its
 * PriceSet, so prices are upserted by id instead of rewriting the set, which
 * would drop the prices of every other offer on the variant.
 */
export const upsertOfferPricesWorkflow: ReturnWorkflow<
  UpsertOfferPricesWorkflowInput,
  AddOfferPricesStepOutput,
  UpsertOfferPricesWorkflowHooks
> = createWorkflow(
  upsertOfferPricesWorkflowId,
  function (input: WorkflowData<UpsertOfferPricesWorkflowInput>) {
    const offerIds = transform({ input }, ({ input }) =>
      input.offers.map((o) => o.id),
    )

    const { data: offerRows } = useQueryGraphStep({
      entity: "offer",
      fields: [
        "id",
        "variant_id",
        "product_variant.price_set.id",
        ...OFFER_PRICE_FIELDS,
      ],
      filters: { id: offerIds },
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
            prices?: Array<OfferPriceDTO | null> | null
          }>).map((o) => [o.id, o]),
        )

        const addPricesPayload: AddOfferPricesStepInput = []
        const toRemoveIds: string[] = []
        const removedLinks: LinkDefinition[] = []
        const changes: Array<{
          offer_id: string
          previous_prices: OfferPriceDTO[]
          updated: string[]
          deleted: string[]
        }> = []

        for (const offer of input.offers) {
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
          const previousPrices = pickOfferPrices(loaded)
          const ownedById = new Map(previousPrices.map((p) => [p.id, p]))
          const ownedIds = new Set(ownedById.keys())
          const incomingIds = offer.prices
            .map((p) => p.id)
            .filter((id): id is string => !!id)

          assertOfferPriceOwnership({
            offer_id: offer.id,
            price_ids: incomingIds,
            owned_price_ids: ownedIds,
          })

          const deleted: string[] = []
          const keepIds = new Set(incomingIds)
          for (const ownedId of ownedIds) {
            if (!keepIds.has(ownedId)) {
              toRemoveIds.push(ownedId)
              deleted.push(ownedId)
              removedLinks.push({
                [MercurModules.OFFER]: { offer_id: offer.id },
                [Modules.PRICING]: { price_id: ownedId },
              })
            }
          }

          const updated: string[] = []
          const upsertPrices: Array<
            PricingTypes.CreatePricesDTO & { id?: string }
          > = offer.prices.map((p) => {
            const rules = { ...(p.rules ?? {}), offer_id: offer.id }
            const base: PricingTypes.CreatePricesDTO & { id?: string } = {
              amount: p.amount,
              currency_code: p.currency_code,
              rules,
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

            const existing = p.id ? ownedById.get(p.id) : undefined
            if (existing) {
              const before = serializePrice(
                existing.amount,
                existing.min_quantity,
                existing.max_quantity,
                existing.price_rules ?? [],
              )
              const after = serializePrice(
                p.amount,
                p.min_quantity,
                p.max_quantity,
                Object.entries(rules).map(([attribute, value]) => ({
                  attribute,
                  value,
                })),
              )
              if (before !== after || existing.currency_code !== p.currency_code) {
                updated.push(existing.id)
              }
            }
            return base
          })

          if (upsertPrices.length) {
            addPricesPayload.push({
              priceSetId,
              prices: upsertPrices,
            })
          }

          changes.push({
            offer_id: offer.id,
            previous_prices: previousPrices,
            updated,
            deleted,
          })
        }

        return {
          addPricesPayload,
          toRemoveIds,
          removedLinks,
          changes,
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

    const { data: updatedOfferRows } = useQueryGraphStep({
      entity: "offer",
      fields: ["id", ...OFFER_PRICE_FIELDS],
      filters: { id: offerIds },
    }).config({ name: "get-offer-prices-after-upsert" })

    const hookOffers = transform(
      { pricingDiff, addedPrices, updatedOfferRows },
      ({ pricingDiff, addedPrices, updatedOfferRows }) => {
        const createdByOffer = new Map(
          addedPrices.map((entry) => [entry.offer_id, entry.price_ids]),
        )
        const afterById = new Map(
          (updatedOfferRows as LoadedOfferPrices[]).map((o) => [o.id, o]),
        )
        return pricingDiff.changes.map(
          (change): OfferPricesUpsertedHookOffer => {
            const after = afterById.get(change.offer_id)
            return {
              ...change,
              prices: after ? pickOfferPrices(after) : [],
              created: createdByOffer.get(change.offer_id) ?? [],
            }
          },
        )
      },
    )

    const updatedBy = transform(
      { input },
      ({ input }) => input.updated_by ?? null,
    )

    const offerPricesUpserted = createHook("offerPricesUpserted", {
      offers: hookOffers,
      updated_by: updatedBy,
    })

    return new WorkflowResponse(addedPrices, {
      hooks: [offerPricesUpserted],
    })
  },
)
