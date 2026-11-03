export const findOrphanSellerShippingMethods = <
    TMethod extends { id: string; shipping_option_id?: string | null },
>(input: {
    items: Array<{ offer?: { seller_id?: string | null } | null }>
    shippingMethods: TMethod[]
    shippingOptions: Array<{ id: string; seller?: { id: string } | null }>
}): TMethod[] => {
    const cartSellerIds = new Set<string>()
    for (const item of input.items) {
        if (item.offer?.seller_id) {
            cartSellerIds.add(item.offer.seller_id)
        }
    }
    const sellerByOption = new Map<string, string>()
    for (const option of input.shippingOptions) {
        if (option.seller?.id) {
            sellerByOption.set(option.id, option.seller.id)
        }
    }

    return input.shippingMethods.filter((method) => {
        const sellerId = sellerByOption.get(method.shipping_option_id ?? "")
        return !!sellerId && !cartSellerIds.has(sellerId)
    })
}
