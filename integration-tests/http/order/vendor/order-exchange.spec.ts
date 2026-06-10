import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
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
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Order Exchanges", () => {
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

                const product = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: `Prod${tag}`,
                            variant_attributes: [
                                {
                                    name: `Default${tag}`,
                                    type: "multi_select",
                                    values: ["Default"],
                                    is_variant_axis: true,
                                },
                            ],
                            variants: [
                                {
                                    title: "Default",
                                    sku: `V${tag}`,
                                    attribute_values: {
                                        [`Default${tag}`]: "Default",
                                    },
                                },
                            ],
                        },
                        headers
                    )
                ).data.product

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
                    fields: ["id", "orders.id", "orders.items.id"],
                })
                return (orderGroup[0] as any).orders[0]
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const customerResult = await createCustomerUser(appContainer, {
                    email: "exchangebuyer@test.com",
                    first_name: "Exchange",
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
                    name: "Exchange Channel",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Exchange Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
                })

                seller1Seed = await seedSellerOfferWithShipping({
                    email: "exch-seller1@test.com",
                    name: "ExchS1",
                    stocked: 20,
                    offerPrice: 2500,
                })

                seller2Seed = await seedSellerOfferWithShipping({
                    email: "exch-seller2@test.com",
                    name: "ExchS2",
                    stocked: 20,
                    offerPrice: 2500,
                })
            })

            describe("POST /vendor/exchanges (begin)", () => {
                it("begins an exchange on a seller-owned order", async () => {
                    const order = await completeCartCheckout(seller1Seed.offer.id)

                    const response = await api.post(
                        `/vendor/exchanges`,
                        { order_id: order.id, description: "Customer wants different size" },
                        seller1Seed.headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.exchange).toBeDefined()
                    expect(response.data.exchange.id).toMatch(/^oexc_/)
                })

                it("rejects when caller does not own the order", async () => {
                    const order = await completeCartCheckout(seller1Seed.offer.id)

                    const response = await api
                        .post(
                            `/vendor/exchanges`,
                            { order_id: order.id },
                            seller2Seed.headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("/:id sub-routes (seller-scope)", () => {
                it("rejects inbound items from non-owning seller", async () => {
                    const order = await completeCartCheckout(seller1Seed.offer.id)
                    const exchangeId = (
                        await api.post(
                            `/vendor/exchanges`,
                            { order_id: order.id },
                            seller1Seed.headers
                        )
                    ).data.exchange.id

                    const response = await api
                        .post(
                            `/vendor/exchanges/${exchangeId}/inbound/items`,
                            { items: [{ id: order.items[0].id, quantity: 1 }] },
                            seller2Seed.headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("rejects outbound items from non-owning seller", async () => {
                    const order = await completeCartCheckout(seller1Seed.offer.id)
                    const exchangeId = (
                        await api.post(
                            `/vendor/exchanges`,
                            { order_id: order.id },
                            seller1Seed.headers
                        )
                    ).data.exchange.id

                    const response = await api
                        .post(
                            `/vendor/exchanges/${exchangeId}/outbound/items`,
                            {
                                items: [
                                    { variant_id: seller1Seed.variant.id, quantity: 1 },
                                ],
                            },
                            seller2Seed.headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("DELETE /:id/request cancels the in-flight exchange draft", async () => {
                    const order = await completeCartCheckout(seller1Seed.offer.id)
                    const exchangeId = (
                        await api.post(
                            `/vendor/exchanges`,
                            { order_id: order.id },
                            seller1Seed.headers
                        )
                    ).data.exchange.id

                    const response = await api.delete(
                        `/vendor/exchanges/${exchangeId}/request`,
                        seller1Seed.headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.deleted).toEqual(true)
                })

                it("DELETE /:id/request rejects when caller does not own exchange", async () => {
                    const order = await completeCartCheckout(seller1Seed.offer.id)
                    const exchangeId = (
                        await api.post(
                            `/vendor/exchanges`,
                            { order_id: order.id },
                            seller1Seed.headers
                        )
                    ).data.exchange.id

                    const response = await api
                        .delete(
                            `/vendor/exchanges/${exchangeId}/request`,
                            seller2Seed.headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
