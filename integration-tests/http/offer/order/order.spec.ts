import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import {
    ContainerRegistrationKeys,
    Modules,
} from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import { createVendorProduct } from "../../../helpers/create-product"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

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

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Order - Offer link mirror + reservations", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let region: any
            let salesChannel: any
            let prerequisiteCounter = 0

            const seedSellerOfferWithShipping = async (opts: {
                email: string
                name: string
                stocked: number
                offerPrice: number
                required_quantity?: number
                existingProduct?: any
                variantTitles?: string[]
            }) => {
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                await approveSeller(appContainer, (result.seller as any).id)
                const headers = result.headers
                const uniqueSuffix = `_${opts.name}_${Date.now()}_${++prerequisiteCounter}`

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `Warehouse${uniqueSuffix}` },
                        headers
                    )
                ).data.stock_location

                // Fulfillment set + service zone for shipping options
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    { name: `FS${uniqueSuffix}`, type: "shipping" },
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
                            name: `SZ${uniqueSuffix}`,
                            geo_zones: [
                                { type: "country", country_code: "us" },
                            ],
                        },
                        headers
                    )
                ).data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `SZ${uniqueSuffix}`
                )
                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `SP${uniqueSuffix}`,
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
                        name: `Ship${uniqueSuffix}`,
                        service_zone_id: serviceZone.id,
                        shipping_profile_id: shippingProfile.id,
                        provider_id: "manual_manual",
                        price_type: "flat",
                        type: {
                            label: "Standard",
                            description: "Standard shipping",
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

                const product =
                    opts.existingProduct ??
                    (await createVendorProduct(api, headers, {
                        title: `Prod${uniqueSuffix}`,
                        sku: `V${uniqueSuffix}`,
                        ...(opts.variantTitles && {
                            attributes: [
                                {
                                    title: "Edition",
                                    type: "multi_select" as const,
                                    values: opts.variantTitles,
                                    is_variant_axis: true,
                                },
                            ],
                            variants: opts.variantTitles.map((title) => ({
                                title,
                                sku: `V${uniqueSuffix}_${title}`,
                                options: { Edition: title },
                            })),
                        }),
                    }))

                if (!opts.existingProduct) {
                    await api.post(
                        `/vendor/sales-channels/${salesChannel.id}/products`,
                        { add: [product.id] },
                        headers
                    )
                }

                const createOffer = async (variant: { id: string }) => {
                    const { data } = await api.post(
                        `/vendor/offers`,
                        {
                            sku: `OF${uniqueSuffix}_${variant.id}`,
                            variant_id: variant.id,
                            shipping_profile_id: shippingProfile.id,
                            inventory_items: [
                                {
                                    title: `Inv${uniqueSuffix}_${variant.id}`,
                                    required_quantity:
                                        opts.required_quantity ?? 1,
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
                    return {
                        offer: data.offer,
                        variant,
                        inventoryItemId: data.offer.inventory_items[0]
                            .id as string,
                    }
                }

                const offeredVariants = opts.variantTitles
                    ? product.variants
                    : [product.variants[0]]
                const offers: Awaited<ReturnType<typeof createOffer>>[] = []
                for (const variant of offeredVariants) {
                    offers.push(await createOffer(variant))
                }
                const { offer, inventoryItemId } = offers[0]

                return {
                    sellerId: result.seller.id,
                    headers,
                    stockLocation,
                    inventoryItemId,
                    product,
                    offer,
                    offers,
                }
            }

            const completeCartCheckout = async (
                lines: Array<{ offerId: string; quantity: number }>
            ) => {
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

                for (const line of lines) {
                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        { offer_id: line.offerId, quantity: line.quantity },
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
                return { cart, completeResp }
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const customerResult = await createCustomerUser(appContainer, {
                    email: "orderbuyer@test.com",
                    first_name: "Order",
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
                    name: "Default Store",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Test Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(
                    ContainerRegistrationKeys.LINK
                )
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: {
                        payment_provider_id: "pp_system_default",
                    },
                })
            })

            it("should mirror cart.LineItem ↔ Offer links to order_line_item ↔ Offer after placement", async () => {
                const seed = await seedSellerOfferWithShipping({
                    email: "mirror@test.com",
                    name: "Mirror",
                    stocked: 20,
                    offerPrice: 2500,
                    variantTitles: ["Standard", "Deluxe"],
                })
                const [standard, deluxe] = seed.offers
                const offerIdByVariantId = new Map(
                    seed.offers.map((o) => [o.variant.id, o.offer.id])
                )

                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )

                // order.items come back in no defined order, so a single
                // checkout can pair lines to offers correctly by chance.
                const CHECKOUTS = 6
                for (let i = 0; i < CHECKOUTS; i++) {
                    const { completeResp } = await completeCartCheckout([
                        { offerId: standard.offer.id, quantity: 2 },
                        { offerId: deluxe.offer.id, quantity: 1 },
                    ])
                    expect(completeResp.status).toEqual(200)
                    expect(completeResp.data.type).toEqual("order_group")
                    expect(completeResp.data.order_group.orders).toHaveLength(1)
                    expect(completeResp.data.order_group.orders[0]).toEqual(
                        expect.objectContaining({
                            id: expect.any(String),
                            display_id: expect.any(Number),
                            status: expect.any(String),
                            seller: expect.objectContaining({
                                id: seed.sellerId,
                                name: expect.any(String),
                            }),
                        })
                    )

                    const { data: orderGroup } = await query.graph({
                        entity: "order_group",
                        filters: { id: completeResp.data.order_group.id },
                        fields: [
                            "orders.items.variant_id",
                            "orders.items.offer.id",
                        ],
                    })

                    const [{ orders }] = orderGroup as Array<{
                        orders: Array<{
                            items: Array<{
                                variant_id: string
                                offer?: { id: string } | null
                            }>
                        }>
                    }>
                    const items = orders.flatMap((o) => o.items)
                    expect(items).toHaveLength(2)
                    for (const item of items) {
                        expect(item.offer?.id).toBeDefined()
                        expect(item.offer?.id).toEqual(
                            offerIdByVariantId.get(item.variant_id)
                        )
                    }
                }

                const standardLevel = await readLevel(
                    standard.inventoryItemId,
                    seed.stockLocation.id
                )
                const deluxeLevel = await readLevel(
                    deluxe.inventoryItemId,
                    seed.stockLocation.id
                )
                expect(standardLevel.reserved).toEqual(2 * CHECKOUTS)
                expect(deluxeLevel.reserved).toEqual(CHECKOUTS)
            })

            it("should reserve qty × required_quantity per inventory_item on placement", async () => {
                const seed = await seedSellerOfferWithShipping({
                    email: "reserve@test.com",
                    name: "Reserve",
                    stocked: 50,
                    offerPrice: 3000,
                    required_quantity: 3,
                })

                const { completeResp } = await completeCartCheckout([
                    { offerId: seed.offer.id, quantity: 2 },
                ])
                expect(completeResp.status).toEqual(200)

                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data: levels } = await query.graph({
                    entity: "inventory_level",
                    filters: {
                        inventory_item_id: seed.inventoryItemId,
                        location_id: seed.stockLocation.id,
                    },
                    fields: [
                        "id",
                        "stocked_quantity",
                        "reserved_quantity",
                    ],
                })

                expect(levels).toHaveLength(1)
                // Reservation = qty (2) × required_quantity (3) = 6
                expect(Number(levels[0].reserved_quantity)).toEqual(6)
                expect(Number(levels[0].stocked_quantity)).toEqual(50)
            })

            it("should split offer lines per seller into per-seller orders preserving offer link", async () => {
                const sellerA = await seedSellerOfferWithShipping({
                    email: "split-a@test.com",
                    name: "SplitA",
                    stocked: 20,
                    offerPrice: 2500,
                })
                const sellerB = await seedSellerOfferWithShipping({
                    email: "split-b@test.com",
                    name: "SplitB",
                    stocked: 20,
                    offerPrice: 4000,
                })

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
                    {
                        offer_id: sellerA.offer.id,
                        quantity: 1,
                    },
                    storeHeaders
                )
                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    {
                        offer_id: sellerB.offer.id,
                        quantity: 1,
                    },
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
                expect(completeResp.status).toEqual(200)

                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data: orderGroup } = await query.graph({
                    entity: "order_group",
                    filters: { id: completeResp.data.order_group.id },
                    fields: [
                        "id",
                        "orders.id",
                        "orders.seller.id",
                        "orders.items.id",
                        "orders.items.offer.id",
                    ],
                })

                const orders = (orderGroup[0] as any).orders
                expect(orders).toHaveLength(2)

                const orderForA = orders.find(
                    (o: any) => o.seller.id === sellerA.sellerId
                )
                const orderForB = orders.find(
                    (o: any) => o.seller.id === sellerB.sellerId
                )
                expect(orderForA.items[0].offer.id).toEqual(sellerA.offer.id)
                expect(orderForB.items[0].offer.id).toEqual(sellerB.offer.id)
            })

            const readLevel = async (
                inventoryItemId: string,
                locationId: string
            ) => {
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data: levels } = await query.graph({
                    entity: "inventory_level",
                    filters: {
                        inventory_item_id: inventoryItemId,
                        location_id: locationId,
                    },
                    fields: [
                        "id",
                        "stocked_quantity",
                        "reserved_quantity",
                    ],
                })
                expect(levels).toHaveLength(1)
                return {
                    stocked: Number(levels[0].stocked_quantity),
                    reserved: Number(levels[0].reserved_quantity),
                }
            }

            const fetchOrderId = async (orderGroupId: string) => {
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data } = await query.graph({
                    entity: "order_group",
                    filters: { id: orderGroupId },
                    fields: ["orders.id", "orders.items.id"],
                })
                const orders = (data[0] as any).orders
                return {
                    orderId: orders[0].id as string,
                    itemId: orders[0].items[0].id as string,
                }
            }

            describe("Session 10: createOrderFulfillment override", () => {
                it("decrements stocked by qty × required_quantity and clears the reservation", async () => {
                    const seed = await seedSellerOfferWithShipping({
                        email: "ful-create@test.com",
                        name: "FulCreate",
                        stocked: 50,
                        offerPrice: 3000,
                        required_quantity: 3,
                    })

                    const { completeResp } = await completeCartCheckout([
                        { offerId: seed.offer.id, quantity: 2 },
                    ])
                    expect(completeResp.status).toEqual(200)

                    const before = await readLevel(
                        seed.inventoryItemId,
                        seed.stockLocation.id
                    )
                    expect(before.stocked).toEqual(50)
                    expect(before.reserved).toEqual(6)

                    const { orderId, itemId } = await fetchOrderId(
                        completeResp.data.order_group.id
                    )

                    const fulResp = await api.post(
                        `/vendor/orders/${orderId}/fulfillments`,
                        {
                            items: [{ id: itemId, quantity: 2 }],
                            requires_shipping: true,
                            location_id: seed.stockLocation.id,
                        },
                        seed.headers
                    )
                    expect(fulResp.status).toEqual(200)

                    const after = await readLevel(
                        seed.inventoryItemId,
                        seed.stockLocation.id
                    )
                    // qty (2) × required_quantity (3) = 6 stock units removed,
                    // and the reservation row is deleted because remaining = 0.
                    expect(after.stocked).toEqual(44)
                    expect(after.reserved).toEqual(0)
                })
            })

            describe("Session 10: cancelOrderFulfillment override", () => {
                it("restocks qty × required_quantity and recreates the reservation", async () => {
                    const seed = await seedSellerOfferWithShipping({
                        email: "ful-cancel@test.com",
                        name: "FulCancel",
                        stocked: 50,
                        offerPrice: 3000,
                        required_quantity: 3,
                    })

                    const { completeResp } = await completeCartCheckout([
                        { offerId: seed.offer.id, quantity: 2 },
                    ])
                    const { orderId, itemId } = await fetchOrderId(
                        completeResp.data.order_group.id
                    )

                    const fulResp = await api.post(
                        `/vendor/orders/${orderId}/fulfillments`,
                        {
                            items: [{ id: itemId, quantity: 2 }],
                            requires_shipping: true,
                            location_id: seed.stockLocation.id,
                        },
                        seed.headers
                    )
                    const fulfillmentId = fulResp.data.fulfillment.id

                    const cancelResp = await api.post(
                        `/vendor/orders/${orderId}/fulfillments/${fulfillmentId}/cancel`,
                        {},
                        seed.headers
                    )
                    expect(cancelResp.status).toEqual(200)

                    const after = await readLevel(
                        seed.inventoryItemId,
                        seed.stockLocation.id
                    )
                    // Cancel re-adds the 6 stock units removed at fulfilment and
                    // recreates the reservation Medusa deleted when it dropped
                    // to zero remaining.
                    expect(after.stocked).toEqual(50)
                    expect(after.reserved).toEqual(6)
                })
            })

            describe("Session 10: confirmReturnReceive override", () => {
                it("restocks received_quantity × required_quantity per inventory item", async () => {
                    const seed = await seedSellerOfferWithShipping({
                        email: "return-receive@test.com",
                        name: "ReturnReceive",
                        stocked: 50,
                        offerPrice: 3000,
                        required_quantity: 3,
                    })

                    const { completeResp } = await completeCartCheckout([
                        { offerId: seed.offer.id, quantity: 2 },
                    ])
                    const { orderId, itemId } = await fetchOrderId(
                        completeResp.data.order_group.id
                    )

                    await api.post(
                        `/vendor/orders/${orderId}/fulfillments`,
                        {
                            items: [{ id: itemId, quantity: 2 }],
                            requires_shipping: true,
                            location_id: seed.stockLocation.id,
                        },
                        seed.headers
                    )

                    const afterFulfilment = await readLevel(
                        seed.inventoryItemId,
                        seed.stockLocation.id
                    )
                    expect(afterFulfilment.stocked).toEqual(44)
                    expect(afterFulfilment.reserved).toEqual(0)

                    const createReturn = await api.post(
                        `/vendor/returns`,
                        {
                            order_id: orderId,
                            location_id: seed.stockLocation.id,
                        },
                        seed.headers
                    )
                    const returnId = createReturn.data.return.id

                    await api.post(
                        `/vendor/returns/${returnId}/request-items`,
                        { items: [{ id: itemId, quantity: 1 }] },
                        seed.headers
                    )
                    await api.post(
                        `/vendor/returns/${returnId}/request`,
                        {},
                        seed.headers
                    )

                    await api.post(
                        `/vendor/returns/${returnId}/receive`,
                        {},
                        seed.headers
                    )
                    await api.post(
                        `/vendor/returns/${returnId}/receive-items`,
                        { items: [{ id: itemId, quantity: 1 }] },
                        seed.headers
                    )
                    const confirmResp = await api.post(
                        `/vendor/returns/${returnId}/receive/confirm`,
                        {},
                        seed.headers
                    )
                    expect(confirmResp.status).toEqual(200)

                    const after = await readLevel(
                        seed.inventoryItemId,
                        seed.stockLocation.id
                    )
                    // received_quantity (1) × required_quantity (3) = 3 stock
                    // units restocked.
                    expect(after.stocked).toEqual(47)
                    expect(after.reserved).toEqual(0)
                })
            })

            it("should complete a cart for an offer whose seller is not the product's default seller", async () => {
                const sellerA = await seedSellerOfferWithShipping({
                    email: "profile-a@test.com",
                    name: "ProfileA",
                    stocked: 10,
                    offerPrice: 2500,
                })
                const sellerB = await seedSellerOfferWithShipping({
                    email: "profile-b@test.com",
                    name: "ProfileB",
                    stocked: 10,
                    offerPrice: 3500,
                    existingProduct: sellerA.product,
                })

                expect(sellerB.offer.shipping_profile_id).not.toEqual(
                    sellerA.offer.shipping_profile_id
                )

                const { completeResp } = await completeCartCheckout([
                    { offerId: sellerB.offer.id, quantity: 1 },
                ])

                expect(completeResp.status).toEqual(200)
                expect(completeResp.data.type).toEqual("order_group")

                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data: orderGroup } = await query.graph({
                    entity: "order_group",
                    filters: { id: completeResp.data.order_group.id },
                    fields: [
                        "id",
                        "orders.id",
                        "orders.seller.id",
                        "orders.items.offer.id",
                    ],
                })

                const orders = (orderGroup[0] as any).orders
                expect(orders).toHaveLength(1)
                expect(orders[0].seller.id).toEqual(sellerB.sellerId)
                expect(orders[0].items[0].offer.id).toEqual(sellerB.offer.id)
            })
        })
    },
})
