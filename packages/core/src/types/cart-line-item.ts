declare module "@medusajs/types" {
  interface CreateCartCreateLineItemDTO {
    /**
     * Mercur extension: binds this cart line to a specific offer.
     * Required on every Mercur add-to-cart call. Consumed by the
     * `setPricingContext` hook on Medusa's stock `addToCartWorkflow`
     * (and propagated through `additional_data.mercur.offer_ids_by_variant`
     * for the downstream `refreshCartItemsWorkflow` and
     * `beforeRefreshingPaymentCollection` hook). Not stored on the
     * line item itself; the writable `cart_line_item ↔ offer` link
     * is the steady-state source after the first refresh.
     */
    offer_id: string
  }
}

export {}
