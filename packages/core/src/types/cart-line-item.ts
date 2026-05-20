declare module "@medusajs/types" {
  interface CreateCartCreateLineItemDTO {
    /**
     * Mercur extension: binds this cart line to a specific offer.
     * Required on every Mercur add-to-cart call. Consumed by the
     * same-id `addToCartWorkflow` override to resolve `offer.price_set_id`
     * for pricing, by the patched `getLineItemActionsStep` for merge
     * identity, and by `linkLineItemToOfferStep` to write the
     * `cart.LineItem ↔ Offer` link row after the line item is persisted.
     * Not stored on the line item itself.
     */
    offer_id: string
  }
}

export {}
