import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { LinkDefinition, PricingTypes } from "@medusajs/framework/types"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { MercurModules, UpsertOfferPriceDTO } from "@mercurjs/types"

import {
  addOfferPricesStep,
  removeOfferPricesStep,
  type AddOfferPricesStepInput,
} from "../steps"
import { assertOfferPriceOwnership } from "../utils"

export type UpsertOfferPricesWorkflowInput = {
  offers: {
    id: string
    prices: UpsertOfferPriceDTO[]
  }[]
}

export const upsertOfferPricesWorkflowId = "upsert-offer-prices"

/**
 * Replaces each offer's own prices. Offers on the same variant share its
 * PriceSet, so prices are upserted by id instead of rewriting the set, which
 * would drop the prices of every other offer on the variant.
 */
export const upsertOfferPricesWorkflow = createWorkflow(
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
        "prices.id",
        "prices.amount",
        "prices.currency_code",
        "prices.min_quantity",
        "prices.max_quantity",
        "prices.price_rules.attribute",
        "prices.price_rules.value",
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
            prices?: Array<{ id: string } | null> | null
          }>).map((o) => [o.id, o]),
        )

        const addPricesPayload: AddOfferPricesStepInput = []
        const toRemoveIds: string[] = []
        const removedLinks: LinkDefinition[] = []

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

    return new WorkflowResponse(addedPrices)
  },
)
