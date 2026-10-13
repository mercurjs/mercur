import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
    completeSplitOrderCheckout,
    seedSellerOfferWithShipping,
} from "./split-order-checkout"

type ApiClient = {
    get: (url: string, config?: unknown) => Promise<{ data: any }>
    post: (url: string, body?: unknown, config?: unknown) => Promise<{ data: any }>
}

/**
 * A seller with a store shipping option, an `is_return` shipping option on the
 * same service zone, and one stocked offer — everything a return request flow
 * needs on the seller side.
 */
export const createReturnRequestSeller = async (opts: {
    container: MedusaContainer
    api: ApiClient
    salesChannelId: string
    email: string
    name: string
    offerPrice: number
}) => {
    const seeded = await seedSellerOfferWithShipping({
        container: opts.container,
        api: opts.api,
        salesChannelId: opts.salesChannelId,
        email: opts.email,
        name: opts.name,
        stocked: 100,
        offerPrice: opts.offerPrice,
    })

    const [storeOption] = (
        await opts.api.get(
            `/vendor/shipping-options?fields=id,service_zone_id,shipping_profile_id,provider_id`,
            seeded.headers
        )
    ).data.shipping_options

    const returnShippingOption = (
        await opts.api.post(
            `/vendor/shipping-options`,
            {
                name: `${opts.name} Return Shipping`,
                service_zone_id: storeOption.service_zone_id,
                shipping_profile_id: storeOption.shipping_profile_id,
                provider_id: storeOption.provider_id,
                price_type: "flat",
                type: {
                    label: "Return",
                    description: "Return shipping",
                    code: "return",
                },
                prices: [{ currency_code: "usd", amount: 300 }],
                rules: [{ attribute: "is_return", value: "true", operator: "eq" }],
            },
            seeded.headers
        )
    ).data.shipping_option

    const [stockLocation] = (
        await opts.api.get(`/vendor/stock-locations`, seeded.headers)
    ).data.stock_locations

    return {
        sellerId: seeded.sellerId,
        headers: seeded.headers,
        offer: seeded.offer,
        stockLocationId: stockLocation.id as string,
        returnShippingOptionId: returnShippingOption.id as string,
    }
}

/**
 * Checks out one offer and walks the seller side to "delivered": fulfil, ship,
 * mark as delivered. Returns the order with its items.
 */
export const createDeliveredOrder = async (opts: {
    container: MedusaContainer
    api: ApiClient
    storeHeaders: unknown
    sellerHeaders: unknown
    regionId: string
    salesChannelId: string
    customerEmail: string
    offerId: string
    stockLocationId: string
}) => {
    const { id: orderId } = await completeSplitOrderCheckout({
        container: opts.container,
        api: opts.api,
        storeHeaders: opts.storeHeaders,
        regionId: opts.regionId,
        salesChannelId: opts.salesChannelId,
        email: opts.customerEmail,
        offerId: opts.offerId,
    })

    const order = (
        await opts.api.get(`/vendor/orders/${orderId}?fields=*items`, opts.sellerHeaders)
    ).data.order

    const items = order.items.map((item: { id: string; quantity: number }) => ({
        id: item.id,
        quantity: item.quantity,
    }))

    const fulfillment = (
        await opts.api.post(
            `/vendor/orders/${orderId}/fulfillments`,
            { items, requires_shipping: true, location_id: opts.stockLocationId },
            opts.sellerHeaders
        )
    ).data.fulfillment

    await opts.api.post(
        `/vendor/orders/${orderId}/fulfillments/${fulfillment.id}/shipments`,
        { items },
        opts.sellerHeaders
    )

    await opts.api.post(
        `/vendor/orders/${orderId}/fulfillments/${fulfillment.id}/mark-as-delivered`,
        {},
        opts.sellerHeaders
    )

    return (
        await opts.api.get(`/vendor/orders/${orderId}?fields=*items`, opts.sellerHeaders)
    ).data.order
}

export const eventually = async (assertion: () => Promise<void>, timeoutMs = 15000) => {
    const deadline = Date.now() + timeoutMs
    for (;;) {
        try {
            return await assertion()
        } catch (error) {
            if (Date.now() > deadline) {
                throw error
            }
            await new Promise((resolve) => setTimeout(resolve, 250))
        }
    }
}

/**
 * Captures the shared cart payment and waits for Mercur's split subscriber to
 * give the order its own captured payment, which is what a refund needs.
 */
export const captureOrderPayment = async (opts: {
    container: MedusaContainer
    api: ApiClient
    adminHeaders: unknown
    orderId: string
}) => {
    const query = opts.container.resolve(ContainerRegistrationKeys.QUERY)

    const loadOrder = async () => {
        const {
            data: [order],
        } = await query.graph({
            entity: "order",
            filters: { id: opts.orderId },
            fields: [
                "id",
                "payment_collections.payments.id",
                "payment_collections.payments.captured_at",
                "cart.payment_collection.payments.id",
            ],
        })
        return order
    }

    const before = await loadOrder()
    const cartPaymentId = before.cart.payment_collection.payments[0].id

    await opts.api.post(`/admin/payments/${cartPaymentId}/capture`, {}, opts.adminHeaders)

    let paymentId = ""
    await eventually(async () => {
        const order = await loadOrder()
        const captured = (order.payment_collections ?? [])
            .flatMap((collection: any) => collection.payments ?? [])
            .find((payment: any) => payment.captured_at)
        expect(captured).toBeDefined()
        paymentId = captured.id
    })

    return paymentId
}
