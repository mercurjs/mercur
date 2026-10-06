import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

const approveSeller = async (
    container: MedusaContainer,
    sellerId: string
) => {
    const sellerModule: any = container.resolve(MercurModules.SELLER)
    await sellerModule.updateSellers({
        id: sellerId,
        status: SellerStatus.OPEN,
    })
}

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Admin - Order Group store filter", () => {
            let appContainer: MedusaContainer
            let seller1Seed: any
            let seller2Seed: any
            let storeHeaders: any
            let region: any
            let salesChannel: any
            let prerequisiteCounter = 0

            const seedSellerOfferWithShipping = async (opts: {
                email: string
                name: string
                stocked: number
                offerPrice: number
            }) => {
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                await approveSeller(appContainer, (result.seller as any).id)
                const headers = result.headers
                const tag = `_${opts.name}_${Date.now()}_${++prerequisiteCounter}`

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `Warehouse${tag}` },
                        headers
                    )
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
                ).data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `SZ${tag}`
                )
                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `SP${tag}`,
                })

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
                    { add: ["manual_manual"] },
                    headers
                )
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                    { add: [salesChannel.id] },
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
                    `/vendor/sales-channels/${salesChannel.id}/products`,
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
                            prices: [
                                {
                                    amount: opts.offerPrice,
                                    currency_code: "usd",
                                },
                            ],
                        },
                        headers
                    )
                ).data.offer

                return {
                    sellerId: result.seller.id,
                    headers,
                    product,
                    variant: product.variants[0],
                    offer,
                }
            }

            const completeCartCheckout = async (offerId: string) => {
                const cart = (
                    await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                ).data.cart

                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { offer_id: offerId, quantity: 1 },
                    storeHeaders
                )

                await api.post(
                    `/store/carts/${cart.id}`,
                    {
                        email: "buyer@test.com",
                        shipping_address: {
                            first_name: "Buyer",
                            last_name: "Test",
                            address_1: "123 Main St",
                            city: "New York",
                            country_code: "us",
                            postal_code: "10001",
                        },
                        billing_address: {
                            first_name: "Buyer",
                            last_name: "Test",
                            address_1: "123 Main St",
                            city: "New York",
                            country_code: "us",
                            postal_code: "10001",
                        },
                    },
                    storeHeaders
                )

                const shippingOptionsResp = await api.get(
                    `/store/shipping-options?cart_id=${cart.id}`,
                    storeHeaders
                )
                const allOptions = Object.values(
                    shippingOptionsResp.data.shipping_options as Record<
                        string,
                        any[]
                    >
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
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data: orderGroup } = await query.graph({
                    entity: "order_group",
                    filters: { id: orderGroupId },
                    fields: ["id", "orders.id"],
                })
                return {
                    orderGroupId,
                    order: (orderGroup[0] as any).orders[0],
                }
            }

            const completeMultiSellerCheckout = async (offerIds: string[]) => {
                const cart = (
                    await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                ).data.cart

                for (const offerId of offerIds) {
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        { offer_id: offerId, quantity: 1 },
                        storeHeaders
                    )
                }

                await api.post(
                    `/store/carts/${cart.id}`,
                    {
                        email: "buyer@test.com",
                        shipping_address: {
                            first_name: "Buyer",
                            last_name: "Test",
                            address_1: "123 Main St",
                            city: "New York",
                            country_code: "us",
                            postal_code: "10001",
                        },
                        billing_address: {
                            first_name: "Buyer",
                            last_name: "Test",
                            address_1: "123 Main St",
                            city: "New York",
                            country_code: "us",
                            postal_code: "10001",
                        },
                    },
                    storeHeaders
                )

                const shippingOptionsResp = await api.get(
                    `/store/shipping-options?cart_id=${cart.id}`,
                    storeHeaders
                )
                const allOptions = Object.values(
                    shippingOptionsResp.data.shipping_options as Record<
                        string,
                        any[]
                    >
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
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data: orderGroup } = await query.graph({
                    entity: "order_group",
                    filters: { id: orderGroupId },
                    fields: ["id", "orders.id", "orders.seller.id"],
                })
                return {
                    orderGroupId,
                    orders: (orderGroup[0] as any).orders as {
                        id: string
                        seller: { id: string }
                    }[],
                }
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const customerResult = await createCustomerUser(appContainer, {
                    email: "adminfilterbuyer@test.com",
                    first_name: "Filter",
                    last_name: "Buyer",
                })
                const apiKey = await generatePublishableKey(appContainer)
                const baseStoreHeaders = generateStoreHeaders({
                    publishableKey: apiKey,
                })
                storeHeaders = {
                    headers: {
                        ...baseStoreHeaders.headers,
                        ...customerResult.headers.headers,
                    },
                }

                const salesChannelModule =
                    appContainer.resolve<ISalesChannelModuleService>(
                        Modules.SALES_CHANNEL
                    )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "Admin Filter Channel",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Admin Filter Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: {
                        payment_provider_id: "pp_system_default",
                    },
                })

                seller1Seed = await seedSellerOfferWithShipping({
                    email: "admin-filter-s1@test.com",
                    name: "AdminFilterS1",
                    stocked: 20,
                    offerPrice: 2500,
                })

                seller2Seed = await seedSellerOfferWithShipping({
                    email: "admin-filter-s2@test.com",
                    name: "AdminFilterS2",
                    stocked: 20,
                    offerPrice: 2500,
                })
            })

            describe("GET /admin/order-groups?seller_id=...", () => {
                it("returns only the selected seller's groups", async () => {
                    const { orderGroupId: groupA } = await completeCartCheckout(
                        seller1Seed.offer.id
                    )
                    const { orderGroupId: groupB } = await completeCartCheckout(
                        seller2Seed.offer.id
                    )

                    const response = await api.get(
                        `/admin/order-groups?seller_id=${seller1Seed.sellerId}`,
                        adminHeaders
                    )

                    expect(response.status).toEqual(200)
                    const ids = response.data.order_groups.map((g: any) => g.id)
                    expect(ids).toContain(groupA)
                    expect(ids).not.toContain(groupB)
                })

                it("keeps every child order and the full aggregates of a matching multi-seller group", async () => {
                    const { orderGroupId } = await completeMultiSellerCheckout([
                        seller1Seed.offer.id,
                        seller2Seed.offer.id,
                    ])

                    const unfiltered = await api.get(
                        `/admin/order-groups?id=${orderGroupId}`,
                        adminHeaders
                    )
                    const baseline = unfiltered.data.order_groups[0]
                    expect(baseline.orders.length).toEqual(2)
                    expect(baseline.seller_count).toEqual(2)
                    expect(baseline.total).toBeGreaterThan(0)

                    const response = await api.get(
                        `/admin/order-groups?seller_id=${seller1Seed.sellerId}`,
                        adminHeaders
                    )

                    expect(response.status).toEqual(200)
                    const group = response.data.order_groups.find(
                        (g: any) => g.id === orderGroupId
                    )
                    expect(group).toBeDefined()
                    expect(group.orders.length).toEqual(2)
                    expect(group.seller_count).toEqual(2)
                    expect(group.total).toEqual(baseline.total)
                })

                it("returns an empty list for an unknown seller", async () => {
                    await completeCartCheckout(seller1Seed.offer.id)

                    const response = await api.get(
                        `/admin/order-groups?seller_id=seller_does_not_exist`,
                        adminHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.order_groups.length).toEqual(0)
                })

                it("returns all groups when no seller filter is applied", async () => {
                    const { orderGroupId: groupA } = await completeCartCheckout(
                        seller1Seed.offer.id
                    )
                    const { orderGroupId: groupB } = await completeCartCheckout(
                        seller2Seed.offer.id
                    )

                    const response = await api.get(
                        `/admin/order-groups`,
                        adminHeaders
                    )

                    expect(response.status).toEqual(200)
                    const ids = response.data.order_groups.map((g: any) => g.id)
                    expect(ids).toContain(groupA)
                    expect(ids).toContain(groupB)
                })
            })

            describe("GET /admin/order-groups?payment_status=...", () => {
                const listIds = async (paymentStatus: string) => {
                    const response = await api.get(
                        `/admin/order-groups?payment_status=${paymentStatus}`,
                        adminHeaders
                    )
                    expect(response.status).toEqual(200)
                    return response.data.order_groups.map((g: any) => g.id)
                }

                const eventually = async (assertion: () => Promise<void>) => {
                    const deadline = Date.now() + 15000
                    for (;;) {
                        try {
                            return await assertion()
                        } catch (error) {
                            if (Date.now() > deadline) {
                                throw error
                            }
                            await new Promise((r) => setTimeout(r, 250))
                        }
                    }
                }

                const paymentStatusOf = async (orderGroupId: string) => {
                    const response = await api.get(
                        `/admin/order-groups/${orderGroupId}?fields=+orders.payment_status`,
                        adminHeaders
                    )
                    return response.data.order_group.orders[0].payment_status
                }

                it("matches groups by the payment status computed for their orders", async () => {
                    const { orderGroupId } = await completeCartCheckout(
                        seller1Seed.offer.id
                    )
                    const status = await paymentStatusOf(orderGroupId)
                    expect(["authorized", "captured"]).toContain(status)

                    expect(await listIds(status)).toContain(orderGroupId)
                    expect(await listIds("refunded")).not.toContain(orderGroupId)
                    expect(await listIds("not_paid")).not.toContain(orderGroupId)
                })

                it("follows the status after the payment is captured", async () => {
                    const { orderGroupId, order } = await completeCartCheckout(
                        seller1Seed.offer.id
                    )

                    const query = appContainer.resolve(
                        ContainerRegistrationKeys.QUERY
                    )
                    const {
                        data: [orderWithPayments],
                    } = await query.graph({
                        entity: "order",
                        filters: { id: order.id },
                        fields: [
                            "payment_collections.payments.id",
                            "cart.payment_collection.payments.id",
                        ],
                    })
                    const paymentId =
                        (orderWithPayments as any).payment_collections?.[0]
                            ?.payments?.[0]?.id ??
                        (orderWithPayments as any).cart.payment_collection
                            .payments[0].id
                    await api.post(
                        `/admin/payments/${paymentId}/capture`,
                        {},
                        adminHeaders
                    )

                    await eventually(async () => {
                        expect(await paymentStatusOf(orderGroupId)).toEqual(
                            "captured"
                        )
                    })

                    expect(await listIds("captured")).toContain(orderGroupId)
                    expect(await listIds("authorized")).not.toContain(
                        orderGroupId
                    )
                })
            })

            describe("GET /admin/order-groups?status=...", () => {
                it("matches groups by child order status without shrinking seller_count or total", async () => {
                    const { orderGroupId, orders } =
                        await completeMultiSellerCheckout([
                            seller1Seed.offer.id,
                            seller2Seed.offer.id,
                        ])
                    const { orderGroupId: pendingOnlyGroupId } =
                        await completeCartCheckout(seller1Seed.offer.id)

                    const baseline = (
                        await api.get(
                            `/admin/order-groups?id=${orderGroupId}`,
                            adminHeaders
                        )
                    ).data.order_groups[0]
                    expect(baseline.seller_count).toEqual(2)
                    expect(baseline.orders.length).toEqual(2)

                    const seller2Order = orders.find(
                        (o) => o.seller?.id === seller2Seed.sellerId
                    )!
                    const cancelResp = await api.post(
                        `/vendor/orders/${seller2Order.id}/cancel`,
                        {},
                        seller2Seed.headers
                    )
                    expect(cancelResp.status).toEqual(200)

                    const canceled = await api.get(
                        `/admin/order-groups?status=canceled`,
                        adminHeaders
                    )
                    expect(canceled.status).toEqual(200)
                    const canceledIds = canceled.data.order_groups.map(
                        (g: any) => g.id
                    )
                    expect(canceledIds).toContain(orderGroupId)
                    expect(canceledIds).not.toContain(pendingOnlyGroupId)

                    const group = canceled.data.order_groups.find(
                        (g: any) => g.id === orderGroupId
                    )
                    expect(group.orders.length).toEqual(2)
                    expect(group.seller_count).toEqual(2)
                    expect(group.total).toEqual(baseline.total)

                    const pending = await api.get(
                        `/admin/order-groups?status=pending`,
                        adminHeaders
                    )
                    const pendingGroup = pending.data.order_groups.find(
                        (g: any) => g.id === orderGroupId
                    )
                    expect(pendingGroup).toBeDefined()
                    expect(pendingGroup.orders.length).toEqual(2)
                    expect(pendingGroup.seller_count).toEqual(2)
                    expect(pendingGroup.total).toEqual(baseline.total)
                })
            })

            describe("GET /admin/order-groups?order=...", () => {
                it("sorts by display_id in both directions", async () => {
                    const { orderGroupId: first } = await completeCartCheckout(
                        seller1Seed.offer.id
                    )
                    const { orderGroupId: second } = await completeCartCheckout(
                        seller2Seed.offer.id
                    )
                    const { orderGroupId: third } = await completeCartCheckout(
                        seller1Seed.offer.id
                    )

                    const ascending = await api.get(
                        `/admin/order-groups?order=display_id&fields=id,display_id`,
                        adminHeaders
                    )
                    expect(ascending.status).toEqual(200)
                    const ascIds = ascending.data.order_groups.map(
                        (g: any) => g.id
                    )
                    expect(ascIds).toEqual([first, second, third])
                    const ascDisplayIds = ascending.data.order_groups.map(
                        (g: any) => g.display_id
                    )
                    expect(ascDisplayIds).toEqual(
                        [...ascDisplayIds].sort((a, b) => a - b)
                    )

                    const descending = await api.get(
                        `/admin/order-groups?order=-display_id&fields=id,display_id`,
                        adminHeaders
                    )
                    expect(descending.status).toEqual(200)
                    const descIds = descending.data.order_groups.map(
                        (g: any) => g.id
                    )
                    expect(descIds).toEqual([third, second, first])
                })
            })
        })
    },
})
