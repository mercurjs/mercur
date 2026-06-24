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

    const inventoryItemsToCreate = transform({ input }, ({ input }) => {
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
        const start = items.length
        offer.inventory_items.forEach((item) => {
          items.push({
            sku: item.sku,
            title: item.title ?? item.sku ?? offer.sku,
            location_levels: item.stock_levels ?? [],
          })
        })
        offerSpans.push({ start, length: offer.inventory_items.length })
      })

      return { items, offerSpans }
    })

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

    const variantIds = transform({ input }, ({ input }) =>
      Array.from(new Set(input.offers.map((o) => o.variant_id))),
    )

    const { data: variants } = useQueryGraphStep({
      entity: "product_variant",
      fields: ["id", "ean", "upc", "price_set.id", "product.id"],
      filters: { id: variantIds },
    }).config({ name: "get-variants" })

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
      offers.map((o) => ({ id: o.id })),
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
