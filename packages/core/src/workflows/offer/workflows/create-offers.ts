import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import {
  createPriceSetsStep,
  createRemoteLinkStep,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { CreateOfferDTO, MercurModules } from "@mercurjs/types"

import { createOffersStep } from "../steps"
import { OfferWorkflowEvents } from "../../events"

export type CreateOffersWorkflowInput = {
  offers: CreateOfferDTO[]
} & AdditionalData

export const createOffersWorkflowId = "create-offers"

export const createOffersWorkflow = createWorkflow(
  createOffersWorkflowId,
  function (input: CreateOffersWorkflowInput) {
    const validate = createHook("validate", { input })

    const variantIds = transform({ input }, ({ input }) =>
      Array.from(new Set(input.offers.map((o) => o.variant_id)))
    )
    const inventoryItemIds = transform({ input }, ({ input }) =>
      Array.from(
        new Set(
          input.offers.flatMap((o) =>
            o.inventory_items.map((i) => i.inventory_item_id)
          )
        )
      )
    )

    const { data: variants } = useQueryGraphStep({
      entity: "product_variant",
      fields: ["id", "ean", "upc"],
      filters: { id: variantIds },
    }).config({ name: "get-variants" })

    const { data: inventoryItems } = useQueryGraphStep({
      entity: "inventory_item",
      fields: ["id"],
      filters: { id: inventoryItemIds },
    }).config({ name: "get-inventory-items" })

    const validated = transform(
      { input, variants, inventoryItems, variantIds, inventoryItemIds },
      ({ input, variants, inventoryItems, variantIds, inventoryItemIds }) => {
        const variantById = new Map(variants.map((v) => [v.id, v]))
        const inventoryIds = new Set(inventoryItems.map((i) => i.id))

        const missingVariant = variantIds.find((id) => !variantById.has(id))
        if (missingVariant) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Variant with id ${missingVariant} was not found`
          )
        }

        const missingInventory = inventoryItemIds.find(
          (id) => !inventoryIds.has(id)
        )
        if (missingInventory) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Inventory item with id ${missingInventory} was not found`
          )
        }

        return input.offers.map((offer) => {
          if (!offer.inventory_items.length) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "Offer must have at least one inventory item"
            )
          }
          const seen = new Set<string>()
          for (const item of offer.inventory_items) {
            if (seen.has(item.inventory_item_id)) {
              throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Duplicate inventory_item_id ${item.inventory_item_id} on offer`
              )
            }
            seen.add(item.inventory_item_id)
          }

          const variant = variantById.get(offer.variant_id)!
          return {
            ...offer,
            ean: offer.ean ?? variant.ean ?? null,
            upc: offer.upc ?? variant.upc ?? null,
          }
        })
      }
    )

    const priceSetInput = transform({ validated }, ({ validated }) =>
      validated.map((o) => ({
        prices: o.prices.map((p) => ({
          amount: p.amount,
          currency_code: p.currency_code,
          min_quantity: p.min_quantity ?? undefined,
          max_quantity: p.max_quantity ?? undefined,
          rules: p.rules ?? {},
        })),
      }))
    )

    const priceSets = createPriceSetsStep(priceSetInput)

    const offerRows = transform(
      { validated, priceSets },
      ({ validated, priceSets }) =>
        validated.map((o, idx) => ({
          seller_id: o.seller_id,
          variant_id: o.variant_id,
          shipping_profile_id: o.shipping_profile_id,
          price_set_id: priceSets[idx].id,
          sku: o.sku,
          ean: o.ean,
          upc: o.upc,
          created_by: o.created_by,
          metadata: o.metadata ?? null,
        }))
    )

    const offers = createOffersStep(offerRows)

    const linkRows = transform(
      { validated, offers },
      ({ validated, offers }) =>
        validated.flatMap((o, idx) =>
          o.inventory_items.map((item) => ({
            [MercurModules.OFFER]: {
              offer_id: offers[idx].id,
            },
            [Modules.INVENTORY]: {
              inventory_item_id: item.inventory_item_id,
            },
            data: {
              required_quantity: item.required_quantity ?? 1,
            },
          }))
        )
    )

    createRemoteLinkStep(linkRows)

    const eventData = transform({ offers }, ({ offers }) =>
      offers.map((o) => ({ id: o.id }))
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
  }
)
