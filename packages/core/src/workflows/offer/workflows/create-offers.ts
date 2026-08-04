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
  createInventoryItemsWorkflow,
  createRemoteLinkStep,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { CreateOfferDTO, MercurModules, OfferDTO } from "@mercurjs/types"

import {
  addOfferPricesStep,
  createOffersStep,
  ensureVariantPriceSetsStep,
} from "../steps"
import { linkSellerInventoryItemStep } from "../../inventory-item/steps"
import { OfferWorkflowEvents } from "../../events"

export type CreateOffersWorkflowInput = {
  offers: CreateOfferDTO[]
} & AdditionalData

export type CreateOffersWorkflowHooks = [
  Hook<"validate", { input: CreateOffersWorkflowInput }, unknown>,
  Hook<
    "offersCreated",
    {
      offers: OfferDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createOffersWorkflowId = "create-offers"

export const createOffersWorkflow: ReturnWorkflow<
  CreateOffersWorkflowInput,
  OfferDTO[],
  CreateOffersWorkflowHooks
> = createWorkflow(
  createOffersWorkflowId,
  function (input: CreateOffersWorkflowInput) {
    const validate = createHook("validate", { input })

    const variantIds = transform({ input }, ({ input }) =>
      Array.from(new Set(input.offers.map((o) => o.variant_id))),
    )

    const { data: variants } = useQueryGraphStep({
      entity: "product_variant",
      fields: ["id", "title", "ean", "upc", "price_set.id", "product.id"],
      filters: { id: variantIds },
    }).config({ name: "get-variants" })

    const inventoryItemsToCreate = transform(
      { input, variants },
      ({ input, variants }) => {
        const variantTitleById = new Map(
          variants.map((v) => [v.id, v.title as string | undefined]),
        )

        const items: Array<{
          sku?: string
          title: string
          location_levels: Array<{
            location_id: string
            stocked_quantity: number
          }>
        }> = []
        const offerSpans: Array<{ start: number; length: number }> = []

        input.offers.forEach((offer) => {
          if (!offer.inventory_items?.length) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "Offer must have at least one inventory item",
            )
          }
          const variantTitle = variantTitleById.get(offer.variant_id)
          const start = items.length
          offer.inventory_items.forEach((item) => {
            items.push({
              sku: item.sku,
              title: variantTitle ?? item.title ?? item.sku ?? offer.sku,
              location_levels: item.stock_levels ?? [],
            })
          })
          offerSpans.push({ start, length: offer.inventory_items.length })
        })

        return { items, offerSpans }
      },
    )

    const itemsForCreation = transform(
      { inventoryItemsToCreate },
      ({ inventoryItemsToCreate }) => inventoryItemsToCreate.items,
    )

    const createdInventoryItems = createInventoryItemsWorkflow.runAsStep({
      input: { items: itemsForCreation },
    })

    const createdInventoryItemIds = transform(
      { createdInventoryItems },
      ({ createdInventoryItems }) => createdInventoryItems.map((i) => i.id),
    )

    const sellerId = transform(
      { input },
      ({ input }) => input.offers[0]?.seller_id ?? "",
    )

    linkSellerInventoryItemStep({
      seller_id: sellerId,
      inventory_item_ids: createdInventoryItemIds,
    })

    const stripped = transform(
      { input, variants, variantIds },
      ({ input, variants, variantIds }) => {
        const variantById = new Map(variants.map((v) => [v.id, v]))

        const missingVariant = variantIds.find((id) => !variantById.has(id))
        if (missingVariant) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Variant with id ${missingVariant} was not found`,
          )
        }

        return input.offers.map((offer) => {
          const variant = variantById.get(offer.variant_id)!
          return {
            seller_id: offer.seller_id,
            variant_id: offer.variant_id,
            product_id: variant.product?.id,
            shipping_profile_id: offer.shipping_profile_id,
            sku: offer.sku,
            ean: offer.ean ?? variant.ean ?? null,
            upc: offer.upc ?? variant.upc ?? null,
            manage_inventory: offer.manage_inventory ?? true,
            allow_backorder: offer.allow_backorder ?? false,
            created_by: offer.created_by,
            metadata: offer.metadata ?? null,
          }
        })
      },
    )

    const variantPriceSetMap = ensureVariantPriceSetsStep({
      variant_ids: variantIds,
    })

    const offers = createOffersStep(stripped)

    // Link each offer's product to the offer's shipping profile. Medusa's
    // cart-refresh keeps a shipping method only when its option's profile
    // matches a profile on the cart's products (`item.variant.product
    // .shipping_profile`); master products carry no profile of their own, so
    // without this link multi-seller carts lose their shipping methods on
    // refresh.
    const offerProductIds = transform({ stripped }, ({ stripped }) =>
      Array.from(
        new Set(
          stripped
            .map((offer) => offer.product_id)
            .filter((id): id is string => !!id),
        ),
      ),
    )

    const { data: productsWithProfiles } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "shipping_profile.id"],
      filters: { id: offerProductIds },
    }).config({ name: "get-product-shipping-profiles" })

    // The product↔shipping-profile link is one-to-one, so a product can carry
    // at most one profile. Skip any product that already has one — including
    // when another seller's offer on the same master product supplies a
    // different profile — otherwise createRemoteLinkStep throws "Cannot create
    // multiple links between 'product' and 'fulfillment'". Deduped by product
    // within the batch too, so the first offer's profile wins.
    const productShippingProfileLinks = transform(
      { stripped, productsWithProfiles },
      ({ stripped, productsWithProfiles }) => {
        const existing = new Set(
          (
            productsWithProfiles as {
              id: string
              shipping_profile?: { id?: string } | null
            }[]
          )
            .filter((product) => product.shipping_profile?.id)
            .map((product) => product.id),
        )
        const seen = new Set<string>()
        const links: LinkDefinition[] = []
        for (const offer of stripped) {
          if (!offer.product_id || !offer.shipping_profile_id) {
            continue
          }
          if (seen.has(offer.product_id) || existing.has(offer.product_id)) {
            continue
          }
          seen.add(offer.product_id)
          links.push({
            [Modules.PRODUCT]: { product_id: offer.product_id },
            [Modules.FULFILLMENT]: {
              shipping_profile_id: offer.shipping_profile_id,
            },
          })
        }
        return links
      },
    )

    createRemoteLinkStep(productShippingProfileLinks).config({
      name: "link-product-shipping-profile",
    })

    const offerInventoryLinks = transform(
      { input, offers, inventoryItemsToCreate, createdInventoryItems },
      ({ input, offers, inventoryItemsToCreate, createdInventoryItems }) => {
        const links: LinkDefinition[] = []
        input.offers.forEach((offer, idx) => {
          const span = inventoryItemsToCreate.offerSpans[idx]
          offer.inventory_items.forEach((entry, i) => {
            const inventoryItemId =
              createdInventoryItems[span.start + i].id
            links.push({
              [MercurModules.OFFER]: { offer_id: offers[idx].id },
              [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
              data: {
                required_quantity: entry.required_quantity ?? 1,
              },
            })
          })
        })
        return links
      },
    )

    createRemoteLinkStep(offerInventoryLinks).config({
      name: "create-offer-inventory-links",
    })

    const addPricesInput = transform(
      { input, offers, variantPriceSetMap },
      ({ input, offers, variantPriceSetMap }) => {
        const payload: PricingTypes.AddPricesDTO[] = []
        input.offers.forEach((offer, idx) => {
          const priceSetId = variantPriceSetMap[offer.variant_id]
          if (!priceSetId) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `No PriceSet resolved for variant ${offer.variant_id}`,
            )
          }
          if (!offer.prices?.length) {
            return
          }
          payload.push({
            priceSetId,
            prices: offer.prices.map((p) => ({
              amount: p.amount,
              currency_code: p.currency_code,
              ...(p.min_quantity !== undefined && p.min_quantity !== null
                ? { min_quantity: p.min_quantity }
                : {}),
              ...(p.max_quantity !== undefined && p.max_quantity !== null
                ? { max_quantity: p.max_quantity }
                : {}),
              rules: { ...(p.rules ?? {}), offer_id: offers[idx].id },
            })),
          })
        })
        return payload
      },
    )

    const addedPrices = addOfferPricesStep(addPricesInput)

    const offerPriceLinks = transform(
      { input, offers, addedPrices },
      ({ input, offers, addedPrices }) => {
        const links: LinkDefinition[] = []
        let cursor = 0
        input.offers.forEach((offer, idx) => {
          if (!offer.prices?.length) {
            return
          }
          const entry = addedPrices[cursor++]
          if (!entry) {
            return
          }
          for (const price of entry.prices) {
            links.push({
              [MercurModules.OFFER]: { offer_id: offers[idx].id },
              [Modules.PRICING]: { price_id: price.id },
            })
          }
        })
        return links
      },
    )

    createRemoteLinkStep(offerPriceLinks).config({
      name: "create-offer-price-links",
    })

    const eventData = transform({ offers }, ({ offers }) =>
      offers.map((o) => ({ id: o.id, product_id: o.product_id })),
    )

    emitEventStep({
      eventName: OfferWorkflowEvents.CREATED,
      data: eventData,
    })

    const offersCreated = createHook("offersCreated", {
      offers,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(offers, {
      hooks: [validate, offersCreated],
    })
  },
)
