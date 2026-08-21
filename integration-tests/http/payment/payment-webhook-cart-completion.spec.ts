import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"
import { createSellerUser } from "../../helpers/create-seller-user"
import { createCustomerUser } from "../../helpers/create-customer-user"
import { createVendorProduct } from "../../helpers/create-product"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../helpers/create-admin-user"

jest.setTimeout(180000)

const approveSeller = async (container: MedusaContainer, sellerId: string) => {
    const sellerModule: any = container.resolve(MercurModules.SELLER)
    await sellerModule.updateSellers({ id: sellerId, status: SellerStatus.OPEN })
}

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Payment webhook - cart completion", () => {
            let appContainer: MedusaContainer
            let sellerSeed: any
            let storeHeaders: any
            let region: any
            let salesChannel: any
            let counter = 0

            const seedSellerOfferWithShipping = async (opts: {
                email: string
                name: string
            }) => {
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                await approveSeller(appContainer, (result.seller as any).id)
                const headers = result.headers
                const tag = `_${opts.name}_${Date.now()}_${++counter}`

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
                                            stocked_quantity: 10,
                                        },
                                    ],
                                },
                            ],
                            prices: [{ amount: 2500, currency_code: "usd" }],
                        },
                        headers
                    )
                ).data.offer

                return { offer }
            }

            const seedReadyCart = async (offerId: string) => {
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
                        email: "buyer@test.com",
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
                const session = (
                    await api.post(
                        `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                        { provider_id: "pp_system_default" },
                        storeHeaders
                    )
                ).data.payment_collection.payment_sessions[0]

                return { cart, sessionId: session.id }
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const customerResult = await createCustomerUser(appContainer, {
                    email: "webhook-buyer@test.com",
                    first_name: "Webhook",
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
                    name: "Webhook Channel",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Webhook Region",
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

                sellerSeed = await seedSellerOfferWithShipping({
                    email: "webhook-seller@test.com",
                    name: "WebhookS1",
                })
            })

            it("routes /hooks/payment/:provider to Mercur, leaving Medusa's webhook event unemitted", async () => {
                const eventBus = appContainer.resolve(Modules.EVENT_BUS)
                const mercurEvents: any[] = []
                const medusaEvents: any[] = []

                eventBus.subscribe(
                    "mercur.payment.webhook_received",
                    async (data: any) => {
                        mercurEvents.push(data)
                    }
                )
                eventBus.subscribe(
                    "payment.webhook_received",
                    async (data: any) => {
                        medusaEvents.push(data)
                    }
                )

                const response = await api.post(
                    `/hooks/payment/pp_system_default`,
                    { hello: "world" }
                )
                expect(response.status).toEqual(200)

                await new Promise((resolve) => setTimeout(resolve, 8000))

                expect(mercurEvents).toHaveLength(1)
                expect(medusaEvents).toHaveLength(0)
            })

            it("completes the cart into split orders when the payment is authorized", async () => {
                const { cart, sessionId } = await seedReadyCart(
                    sellerSeed.offer.id
                )
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { processPaymentWorkflow } = await import(
                    "@mercurjs/core/workflows/payment/workflows/process-payment"
                )

                await processPaymentWorkflow(appContainer).run({
                    input: {
                        action: "authorized",
                        data: { session_id: sessionId },
                    },
                })

                const { data: groups } = await query.graph({
                    entity: "order_group",
                    fields: ["id", "orders.id"],
                    filters: { cart_id: cart.id },
                })
                expect(groups).toHaveLength(1)
                expect((groups[0] as any).orders).toHaveLength(1)

                const { data: orderCarts } = await query.graph({
                    entity: "order_cart",
                    fields: ["order_id"],
                    filters: { cart_id: cart.id },
                })
                expect(orderCarts).toHaveLength(1)
            })

            it("does not create a second order when the storefront already completed the cart", async () => {
                const { cart, sessionId } = await seedReadyCart(
                    sellerSeed.offer.id
                )
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { processPaymentWorkflow } = await import(
                    "@mercurjs/core/workflows/payment/workflows/process-payment"
                )

                const completed = await api.post(
                    `/store/carts/${cart.id}/complete`,
                    {},
                    storeHeaders
                )
                const orderGroupId = completed.data.order_group.id

                await processPaymentWorkflow(appContainer).run({
                    input: {
                        action: "authorized",
                        data: { session_id: sessionId },
                    },
                })

                const { data: groups } = await query.graph({
                    entity: "order_group",
                    fields: ["id", "orders.id"],
                    filters: { cart_id: cart.id },
                })
                expect(groups).toHaveLength(1)
                expect(groups[0].id).toEqual(orderGroupId)
                expect((groups[0] as any).orders).toHaveLength(1)

                const { data: orderCarts } = await query.graph({
                    entity: "order_cart",
                    fields: ["order_id"],
                    filters: { cart_id: cart.id },
                })
                expect(orderCarts).toHaveLength(1)
            })
        })
    },
})
