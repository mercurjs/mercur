import { CartLineItemDTO, CreateCartCreateLineItemDTO } from "@medusajs/framework/types"
import {
  CartWorkflowEvents,
  deduplicate,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  createHook,
  parallelize,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  createLineItemsStep,
  emitEventStep,
  refreshCartItemsWorkflow,
  releaseLockStep,
  updateLineItemsStep,
  useQueryGraphStep,
  validateCartStep,
  validateLineItemPricesStep,
} from "@medusajs/medusa/core-flows"
import type { OfferDTO } from "@mercurjs/types"
import {
  calculateOfferPricesStep,
  decorateLineItemWithOfferStep,
  getLineItemActionsStep,
  linkLineItemToOfferStep,
} from "../steps"
import { cartFieldsForPricingContext } from "../utils/fields"
import { prepareLineItemData } from "../utils/prepare-line-item-data"
import { overrideWorkflow } from "../../utils/override-workflow"

type OfferForPricing = Pick<
  OfferDTO,
  | "id"
  | "price_set_id"
  | "variant_id"
  | "sku"
  | "seller_id"
  | "shipping_profile_id"
  | "deleted_at"
>

const productVariantsFields = [
  "id",
  "title",
  "sku",
  "barcode",
  "thumbnail",
  "manage_inventory",
  "allow_backorder",
  "product.id",
  "product.title",
  "product.description",
  "product.handle",
  "product.thumbnail",
  "product.subtitle",
  "product.collection.title",
  "product.type.value",
  "product.type.id",
  "product.shipping_profile.id",
  "product.discountable",
  "product.is_giftcard",
  "calculated_price.calculated_amount",
  "calculated_price.original_amount",
  "calculated_price.currency_code",
  "calculated_price.is_calculated_price_tax_inclusive",
  "calculated_price.calculated_price.price_list_type",
]

export const addToCartWorkflowId = "add-to-cart"

type AddToCartWorkflowInput = {
  cart_id: string
  items?: CreateCartCreateLineItemDTO[]
  additional_data?: Record<string, unknown>
}

const cartFields = ["completed_at", "locale"].concat(cartFieldsForPricingContext)

export const addToCartWorkflow = overrideWorkflow(
  {
    name: addToCartWorkflowId,
    idempotent: false,
  },
  (input: AddToCartWorkflowInput) => {
    acquireLockStep({
      key: input.cart_id,
      timeout: 2,
      ttl: 10,
    })

    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: cartFields,
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-cart" })

    validateCartStep({ cart })

    const validate = createHook("validate", { input, cart })

    const offerIds = transform({ input }, ({ input }) => {
      const items = input.items ?? []
      const ids: string[] = []
      for (const item of items) {
        if (!item.offer_id) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Every cart line item must carry an offer_id",
          )
        }
        ids.push(item.offer_id)
      }
      return ids
    })

    const { data: offers } = useQueryGraphStep({
      entity: "offer",
      fields: [
        "id",
        "price_set_id",
        "variant_id",
        "sku",
        "seller_id",
        "shipping_profile_id",
        "deleted_at",
      ],
      filters: { id: offerIds },
    }).config({ name: "get-offers-for-pricing" })

    const validatedOffers = transform(
      { offerIds, offers },
      ({ offerIds, offers }) => {
        if (!offerIds.length) {
          return offers as OfferForPricing[]
        }
        const byId = new Map(offers.map((o) => [o.id, o]))
        for (const id of offerIds) {
          const offer = byId.get(id)
          if (!offer || offer.deleted_at) {
            throw new MedusaError(
              MedusaError.Types.NOT_FOUND,
              `Offer ${id} not found`,
            )
          }
        }
        return offers as OfferForPricing[]
      },
    )

    const calculatePricesInput = transform(
      { cart, input },
      ({ cart, input }) => ({
        context: {
          region_id: cart.region_id,
          currency_code: cart.currency_code,
          ...(cart.customer_id ? { customer_id: cart.customer_id } : {}),
        } as Record<string, unknown>,
        items: (input.items ?? []).map((i) => ({
          offer_id: i.offer_id,
          quantity: i.quantity,
        })),
      }),
    )

    const pricedItems = calculateOfferPricesStep({
      context: calculatePricesInput.context as never,
      items: calculatePricesInput.items,
      offers: validatedOffers,
    })

    const variantIds = transform(
      { validatedOffers },
      ({ validatedOffers }) =>
        Array.from(new Set(validatedOffers.map((o) => o.variant_id))),
    )

    const { data: variants } = useQueryGraphStep({
      entity: "variants",
      fields: deduplicate(productVariantsFields),
      filters: { id: variantIds },
      options: { cache: { enable: true } },
    }).config({ name: "fetch-variants" })

    const lineItems = transform(
      {
        cart_id: input.cart_id,
        items: input.items,
        validatedOffers,
        pricedItems,
        variants,
      },
      ({ cart_id, items, validatedOffers, pricedItems, variants }) => {
        const offerById = new Map((validatedOffers ?? []).map((o) => [o.id, o]))
        const priceByOffer = new Map(
          (pricedItems ?? []).map((p) => [p.offer_id, p]),
        )
        const variantById = new Map((variants ?? []).map((v) => [v.id, v]))

        return (items ?? []).map((item) => {
          const offer = offerById.get(item.offer_id)!
          const variant = variantById.get(offer.variant_id)
          const priced = priceByOffer.get(item.offer_id)!
          return prepareLineItemData({
            item: { ...item, variant_id: offer.variant_id },
            variant: variant as never,
            cartId: cart_id,
            unitPrice: priced.unit_price,
            isCustomPrice: true,
            isTaxInclusive:
              variant?.calculated_price
                ?.is_calculated_price_tax_inclusive ?? false,
          })
        })
      },
    )

    validateLineItemPricesStep({ items: lineItems })

    const lineItemActionsInput = transform(
      { input, validatedOffers, pricedItems, cart },
      ({ input, validatedOffers, pricedItems }) => {
        const offerById = new Map((validatedOffers ?? []).map((o) => [o.id, o]))
        const priceByOffer = new Map(
          (pricedItems ?? []).map((p) => [p.offer_id, p]),
        )
        return (input.items ?? []).map((item) => {
          const offer = offerById.get(item.offer_id)!
          const priced = priceByOffer.get(item.offer_id)!
          return {
            variant_id: offer.variant_id,
            offer_id: item.offer_id,
            quantity: item.quantity,
            unit_price: priced.unit_price,
            metadata: item.metadata ?? null,
          }
        })
      },
    )

    const { itemsToCreate, itemsToUpdate } = getLineItemActionsStep({
      id: input.cart_id,
      items: lineItemActionsInput,
    })

    const translatedItemsToCreate = transform(
      { itemsToCreate, lineItems },
      ({ itemsToCreate, lineItems }) => {
        if (!itemsToCreate?.length) return [] as typeof lineItems
        const idxByOffer = new Map<string, number>()
        return itemsToCreate
          .map((item) => {
            const offerId = (item as { offer_id?: string }).offer_id
            if (!offerId) return null
            const start = idxByOffer.get(offerId) ?? 0
            const idx = lineItems.findIndex(
              (li, i) =>
                i >= start &&
                li.variant_id === item.variant_id,
            )
            if (idx === -1) return null
            idxByOffer.set(offerId, idx + 1)
            return lineItems[idx]
          })
          .filter((li): li is NonNullable<typeof li> => li !== null)
      },
    )

    const [createdLineItems, updatedLineItems] = parallelize(
      createLineItemsStep({
        id: input.cart_id,
        items: translatedItemsToCreate,
      }),
      updateLineItemsStep({
        id: input.cart_id,
        items: itemsToUpdate as never,
      }),
    )

    const createdLineItemOfferPairs = transform(
      { createdLineItems, itemsToCreate },
      ({ createdLineItems, itemsToCreate }) => {
        const pairs: Array<{ line_item_id: string; offer_id: string }> = []
        const items = itemsToCreate ?? []
        const created = createdLineItems ?? []
        const maxLen = Math.min(items.length, created.length)
        for (let i = 0; i < maxLen; i++) {
          const offerId = (items[i] as { offer_id?: string }).offer_id
          if (offerId) {
            pairs.push({
              line_item_id: created[i].id,
              offer_id: offerId,
            })
          }
        }
        return pairs
      },
    )

    linkLineItemToOfferStep(createdLineItemOfferPairs)

    const decorateInput = transform(
      { createdLineItemOfferPairs, validatedOffers },
      ({ createdLineItemOfferPairs, validatedOffers }) => {
        const offerById = new Map(
          (validatedOffers ?? []).map((o) => [o.id, o]),
        )
        return createdLineItemOfferPairs.map((pair) => {
          const offer = offerById.get(pair.offer_id)!
          return {
            line_item_id: pair.line_item_id,
            sku: offer.sku,
            shipping_profile_id: offer.shipping_profile_id,
            seller_id: offer.seller_id,
          }
        })
      },
    )

    decorateLineItemWithOfferStep(decorateInput)

    const allItems = transform(
      { createdLineItems, updatedLineItems },
      ({ createdLineItems = [], updatedLineItems = [] }) => {
        return createdLineItems.concat(updatedLineItems) as CartLineItemDTO[]
      },
    )

    refreshCartItemsWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        items: allItems,
        additional_data: input.additional_data,
      },
    })

    parallelize(
      emitEventStep({
        eventName: CartWorkflowEvents.UPDATED,
        data: { id: input.cart_id },
      }),
      releaseLockStep({ key: input.cart_id }),
    )

    return new WorkflowResponse(void 0, {
      hooks: [validate],
    })
  },
)
