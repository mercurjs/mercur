import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
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
  updatePriceSetsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { UpdateOfferDTO, MercurModules } from "@mercurjs/types"

import { removeOfferPricesStep, updateOffersStep } from "../steps"
import { assertOfferPriceOwnership } from "../utils"
import { OfferWorkflowEvents } from "../../events"

/**
 * Setting `prices` on an entry rewrites the offer's slice of the shared
 * variant `PriceSet` with replace semantics (mirroring Medusa's
 * `updateProductVariantsWorkflow`): rows with `id` are updated, rows
 * without `id` are added, and any existing offer-owned price absent from
 * the array is removed. Omit the field to leave prices untouched.
 *
 * `assertOfferPriceOwnership` rejects any incoming `price.id` that does
 * not belong to the offer per the writable `offer ↔ price` list-link —
 * cross-vendor writes are surfaced as `MedusaError.Types.NOT_ALLOWED`.
 */
export type UpdateOffersWorkflowInput = {
  offers: UpdateOfferDTO[]
} & AdditionalData

export const updateOffersWorkflowId = "update-offers"

export const updateOffersWorkflow = createWorkflow(
  updateOffersWorkflowId,
  function (input: UpdateOffersWorkflowInput) {
    const validate = createHook("validate", { input })

    // 1. Strip nested data; only offer-row fields go to updateOffersStep.
    const rowUpdates = transform(input, ({ offers }) =>
      offers.map((o) => ({
        id: o.id,
        sku: o.sku,
        shipping_profile_id: o.shipping_profile_id,
        metadata: o.metadata,
      })),
    )

    // 2. Bulk-update offer rows.
    const offers = updateOffersStep(rowUpdates)

    // 3. Filter offers whose prices changed.
    const offersWithPriceUpdates = transform({ input }, ({ input }) =>
      input.offers
        .filter((o) => Array.isArray(o.prices))
        .map((o) => o.id),
    )

    // 4. Bulk-load `offer.prices` and `variant.price_set.id` via the link.
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

    // 5–6. assertOfferPriceOwnership + compute (toAdd, toUpdate, toRemove).
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
            prices?: Array<{ id: string }> | null
          }>).map((o) => [o.id, o]),
        )

        const priceSetUpserts: PricingTypes.UpsertPriceSetDTO[] = []
        const toRemoveIds: string[] = []
        const newPriceOwners: Array<{
          offer_id: string
          priceSetId: string
          newRowCount: number
        }> = []
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

          const ownedIds = new Set(
            (loaded.prices ?? []).map((p) => p.id),
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

          const newRowCount = offer.prices.filter((p) => !p.id).length

          priceSetUpserts.push({
            id: priceSetId,
            prices: upsertPrices,
          })

          if (newRowCount > 0) {
            newPriceOwners.push({
              offer_id: offer.id,
              priceSetId,
              newRowCount,
            })
          }
        }

        return {
          price_sets: priceSetUpserts,
          toRemoveIds,
          newPriceOwners,
          removedLinks,
        }
      },
    )

    const priceSetsPayload = transform(
      { pricingDiff },
      ({ pricingDiff }) => ({ price_sets: pricingDiff.price_sets }),
    )

    // 7. Bulk-upsert prices (existing get updated, new get inserted).
    const upsertedPriceSets = updatePriceSetsStep(priceSetsPayload)

    // 8. Bulk-remove obsolete Price rows.
    const toRemoveIds = transform(
      { pricingDiff },
      ({ pricingDiff }) => pricingDiff.toRemoveIds,
    )
    removeOfferPricesStep(toRemoveIds)

    // 9. Sync the link pivot: dismiss removed; create new.
    const removedLinks = transform(
      { pricingDiff },
      ({ pricingDiff }) => pricingDiff.removedLinks,
    )
    dismissRemoteLinkStep(removedLinks).config({
      name: "dismiss-removed-offer-price-links",
    })

    const newLinks = transform(
      { pricingDiff, upsertedPriceSets },
      ({ pricingDiff, upsertedPriceSets }) => {
        if (!pricingDiff.newPriceOwners.length) {
          return [] as LinkDefinition[]
        }
        const priceSetById = new Map(
          (upsertedPriceSets ?? []).map((ps) => [ps.id, ps]),
        )
        const links: LinkDefinition[] = []

        // For each owner that contributed new rows, find the matching
        // PriceSet in the upsert response and reconcile its prices'
        // rule values against the owner's offer_id to identify the
        // newly inserted rows.
        for (const owner of pricingDiff.newPriceOwners) {
          const set = priceSetById.get(owner.priceSetId)
          if (!set) continue
          const matchingPrices = (set.prices ?? []).filter((price) => {
            const rules = (price as { price_rules?: Array<{
              attribute: string
              value: string
            }> }).price_rules ?? []
            return rules.some(
              (r) => r.attribute === "offer_id" && r.value === owner.offer_id,
            )
          })

          // Newly created rows are those without a pre-existing link in
          // the offer's prior `prices` list — but we don't have that
          // here. Instead, since updatePriceSetsStep replace-semantics
          // means the returned `prices` are exactly the offer's new set,
          // any price for this offer that doesn't already have an
          // offer-price link row is new. The list-link itself is the
          // source of truth: we'll create one link per matched Price
          // and rely on `createLinksWorkflow`'s idempotent
          // create-or-skip behavior to no-op on already-linked rows.
          for (const price of matchingPrices) {
            links.push({
              [MercurModules.OFFER]: { offer_id: owner.offer_id },
              [Modules.PRICING]: { price_id: price.id },
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
      offers.map((o) => ({ id: o.id })),
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
