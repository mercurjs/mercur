import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"

import { createVendorProduct } from "./create-product"
import { createSellerUser } from "./create-seller-user"

let prerequisiteCounter = 0

export const approveSeller = async (
    container: MedusaContainer,
    sellerId: string
) => {
    const sellerModule: any = container.resolve(MercurModules.SELLER)
    await sellerModule.updateSellers({
        id: sellerId,
        status: SellerStatus.OPEN,
    })
}

export const seedSellerOfferWithShipping = async (opts: {
    container: MedusaContainer
    api: any
    salesChannelId: string
    email: string
    name: string
    stocked: number
    offerPrice: number
}) => {
    const { container, api, salesChannelId } = opts

    const result = await createSellerUser(container, {
        email: opts.email,
        name: opts.name,
    })
    await approveSeller(container, (result.seller as any).id)
    const headers = result.headers
    const tag = `_${opts.name}_${Date.now()}_${++prerequisiteCounter}`

    const stockLocation = (
        await api.post(`/vendor/stock-locations`, { name: `Warehouse${tag}` }, headers)
    ).data.stock_location

    await api.post(
        `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
        { name: `FS${tag}`, type: "shipping" },
        headers
    )
    const fulfillmentSet = (
        await api.get(
            `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
            headers
        )
    ).data.stock_location.fulfillment_sets[0]
    const serviceZone = (
        await api.post(
            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
            {
                name: `SZ${tag}`,
                geo_zones: [{ type: "country", country_code: "us" }],
            },
            headers
        )
    ).data.fulfillment_set.service_zones.find((z: any) => z.name === `SZ${tag}`)
    const shippingProfile = (
        await api.post(
            `/vendor/shipping-profiles`,
            { name: `SP${tag}`, type: "default" },
            headers
        )
    ).data.shipping_profile

    await api.post(
        `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
        { add: ["manual_manual"] },
        headers
    )
    await api.post(
        `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
        { add: [salesChannelId] },
        headers
    )
    await api.post(
        `/vendor/shipping-options`,
        {
            name: `Ship${tag}`,
            service_zone_id: serviceZone.id,
            shipping_profile_id: shippingProfile.id,
            provider_id: "manual_manual",
            price_type: "flat",
            type: {
                label: "Standard",
                description: "Standard",
                code: "standard",
            },
            prices: [{ currency_code: "usd", amount: 500 }],
            rules: [
                {
                    attribute: "enabled_in_store",
                    value: "true",
                    operator: "eq",
                },
            ],
        },
        headers
    )

    const product = await createVendorProduct(api, headers, {
        title: `Prod${tag}`,
        sku: `V${tag}`,
    })

    await api.post(
        `/vendor/sales-channels/${salesChannelId}/products`,
        { add: [product.id] },
        headers
    )

    const offer = (
        await api.post(
            `/vendor/offers`,
            {
                sku: `OF${tag}`,
                variant_id: product.variants[0].id,
                shipping_profile_id: shippingProfile.id,
                inventory_items: [
                    {
                        title: `Inv${tag}`,
                        required_quantity: 1,
                        stock_levels: [
                            {
                                location_id: stockLocation.id,
                                stocked_quantity: opts.stocked,
                            },
                        ],
                    },
                ],
                prices: [{ amount: opts.offerPrice, currency_code: "usd" }],
            },
            headers
        )
    ).data.offer

    return { sellerId: result.seller.id, headers, offer }
}

export const completeSplitOrderCheckout = async (opts: {
    container: MedusaContainer
    api: any
    storeHeaders: any
    regionId: string
    salesChannelId: string
    offerId: string
    /**
     * Must be the authenticated customer's own email. Medusa's
     * findOrCreateCustomerStep treats a customer without `has_account` as a
     * guest, so a different email on the cart moves it to a freshly created
     * guest customer — and the resulting orders stop belonging to the buyer.
     */
    email: string
}) => {
    const { container, api, storeHeaders } = opts

    const cart = (
        await api.post(
            `/store/carts`,
            {
                region_id: opts.regionId,
                sales_channel_id: opts.salesChannelId,
                currency_code: "usd",
            },
            storeHeaders
        )
    ).data.cart

    await api.post(
        `/store/carts/${cart.id}/line-items`,
        { offer_id: opts.offerId, quantity: 1 },
        storeHeaders
    )

    const address = {
        first_name: "Buyer",
        last_name: "Test",
        address_1: "123 Main St",
        city: "New York",
        country_code: "us",
        postal_code: "10001",
    }

    await api.post(
        `/store/carts/${cart.id}`,
        {
            email: opts.email,
            shipping_address: address,
            billing_address: address,
        },
        storeHeaders
    )

    const shippingOptionsResp = await api.get(
        `/store/shipping-options?cart_id=${cart.id}`,
        storeHeaders
    )
    const allOptions = Object.values(
        shippingOptionsResp.data.shipping_options as Record<string, any[]>
    ).flat()
    for (const opt of allOptions) {
        await api.post(
            `/store/carts/${cart.id}/shipping-methods`,
            { option_id: opt.id },
            storeHeaders
        )
    }

    const paymentCollection = (
        await api.post(
            `/store/payment-collections`,
            { cart_id: cart.id },
            storeHeaders
        )
    ).data.payment_collection
    await api.post(
        `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
        { provider_id: "pp_system_default" },
        storeHeaders
    )

    const completeResp = await api.post(
        `/store/carts/${cart.id}/complete`,
        {},
        storeHeaders
    )
    const orderGroupId = completeResp.data.order_group.id
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orderGroup } = await query.graph({
        entity: "order_group",
        filters: { id: orderGroupId },
        fields: ["id", "orders.id"],
    })

    return (orderGroup[0] as any).orders[0]
}
