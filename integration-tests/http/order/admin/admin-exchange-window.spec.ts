import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IOrderModuleService,
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

type AuthHeaders = { headers: Record<string, string> }

jest.setTimeout(240000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("admin exchange 30-day window invariant (FR-BUG-10)", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: AuthHeaders
            let storeHeaders: AuthHeaders
            let region: { id: string; currency_code: string }
            let salesChannel: { id: string }
            let variant: string

            // Per-test fresh setup. Same rationale as
            // cancel-order-invariant.spec.ts.
            let suffix = 0

            beforeAll(async () => {
                appContainer = getContainer()
                await createAdminUser(dbConnection, adminHeaders, appContainer)
            })

            beforeEach(async () => {
                suffix++

                const sellerResult = await createSellerUser(appContainer, {
                    email: `exchange-window-seller-${suffix}@test.com`,
                    name: `Exchange Window Seller ${suffix}`,
                })
                sellerHeaders = sellerResult.headers

                const customer = await createCustomerUser(appContainer, {
                    email: `exchange-window-customer-${suffix}@test.com`,
                    first_name: "Exchange",
                    last_name: "Customer",
                })

                const apiKey = await generatePublishableKey(appContainer)
                const baseStoreHeaders = generateStoreHeaders({
                    publishableKey: apiKey,
                })
                storeHeaders = {
                    headers: {
                        ...baseStoreHeaders.headers,
                        ...customer.headers.headers,
                    },
                }

                const salesChannelModule =
                    appContainer.resolve<ISalesChannelModuleService>(
                        Modules.SALES_CHANNEL,
                    )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: `Exchange Window Store ${suffix}`,
                })

                const regionModule =
                    appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: `Exchange Window Region ${suffix}`,
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(
                    ContainerRegistrationKeys.LINK,
                )
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: {
                        payment_provider_id: "pp_system_default",
                    },
                })

                const product = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: `Exchange Window Product ${suffix}`,
                            options: [{ title: "Size", values: ["M"] }],
                            variants: [
                                {
                                    title: "Medium",
                                    sku: `EW-${suffix}`,
                                    options: { Size: "M" },
                                    prices: [
                                        { currency_code: "usd", amount: 2000 },
                                    ],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        sellerHeaders,
                    )
                ).data.product
                variant = product.variants[0].id

                await setupShipping()
            })

            let prereqCounter = 0

            const setupShipping = async () => {
                const localSuffix = `_ew_${Date.now()}_${++prereqCounter}`

                const sl = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `EW-loc${localSuffix}` },
                        sellerHeaders,
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${sl.id}/fulfillment-sets`,
                    { name: `EW-fs${localSuffix}`, type: "shipping" },
                    sellerHeaders,
                )

                const updatedLocation = await api.get(
                    `/vendor/stock-locations/${sl.id}?fields=*fulfillment_sets`,
                    sellerHeaders,
                )
                const fulfillmentSet =
                    updatedLocation.data.stock_location.fulfillment_sets[0]

                const serviceZoneResp = await api.post(
                    `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                    {
                        name: `EW-sz${localSuffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    sellerHeaders,
                )
                const serviceZone =
                    serviceZoneResp.data.fulfillment_set.service_zones.find(
                        (z: { name: string }) =>
                            z.name === `EW-sz${localSuffix}`,
                    )

                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: `EW-sp${localSuffix}`, type: "default" },
                        sellerHeaders,
                    )
                ).data.shipping_profile

                await api.post(
                    `/vendor/stock-locations/${sl.id}/fulfillment-providers`,
                    { add: ["manual_manual"] },
                    sellerHeaders,
                )
                await api.post(
                    `/vendor/stock-locations/${sl.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    sellerHeaders,
                )

                await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: `EW-out${localSuffix}`,
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
                            {
                                attribute: "is_return",
                                value: "false",
                                operator: "eq",
                            },
                        ],
                    },
                    sellerHeaders,
                )
            }

            const seedPaidOrder = async () => {
                const cart = (
                    await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders,
                    )
                ).data.cart

                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { variant_id: variant, quantity: 1 },
                    storeHeaders,
                )

                const shippingOptions = (
                    await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders,
                    )
                ).data.shipping_options as Record<string, any[]>
                for (const [, opts] of Object.entries(shippingOptions)) {
                    if (opts.length > 0) {
                        await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            { option_id: opts[0].id },
                            storeHeaders,
                        )
                    }
                }

                const paymentCollection = (
                    await api.post(
                        `/store/payment-collections`,
                        { cart_id: cart.id },
                        storeHeaders,
                    )
                ).data.payment_collection

                await api.post(
                    `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                    { provider_id: "pp_system_default" },
                    storeHeaders,
                )

                const orderGroup = (
                    await api.post(
                        `/store/carts/${cart.id}/complete`,
                        {},
                        storeHeaders,
                    )
                ).data.order_group

                const order = (
                    await api.get(
                        `/store/order-groups/${orderGroup.id}?fields=*orders`,
                        storeHeaders,
                    )
                ).data.order_group.orders[0]

                return order
            }

            // Backdate `order.created_at` directly via the order module
            // so we can exercise the 30-day window without depending on
            // wall-clock time. Done via the module service rather than
            // a workflow because there's no public mutation for this.
            const backdateOrder = async (orderId: string, daysAgo: number) => {
                const orderModule = appContainer.resolve<IOrderModuleService>(
                    Modules.ORDER,
                )
                const created_at = new Date(
                    Date.now() - daysAgo * 24 * 60 * 60 * 1000,
                )
                // updateOrders accepts a partial — created_at is on the
                // base model so it round-trips through the module.
                await orderModule.updateOrders(orderId, { created_at } as any)
            }

            describe("POST /admin/exchanges respects 30-day exchange window", () => {
                it("rejects with 400 + EXCHANGE_WINDOW_EXPIRED when order is older than 30 days", async () => {
                    const order = await seedPaidOrder()
                    await backdateOrder(order.id, 31)

                    const response = await api
                        .post(
                            `/admin/exchanges`,
                            { order_id: order.id },
                            adminHeaders,
                        )
                        .catch((err) => err.response)

                    expect(response.status).toEqual(400)
                    expect(response.data.code).toEqual("EXCHANGE_WINDOW_EXPIRED")
                })

                it("accepts the create call when order is within the 30-day window", async () => {
                    const order = await seedPaidOrder()
                    // Just-paid order has `created_at = now`, well inside
                    // the window — no backdate needed.

                    const response = await api.post(
                        `/admin/exchanges`,
                        { order_id: order.id },
                        adminHeaders,
                    )

                    expect(response.status).toEqual(200)
                })
            })
        })
    },
})
