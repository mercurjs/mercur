import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
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

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("GET /admin/orders/:id/seller-valid-stock-locations", () => {
            let appContainer: MedusaContainer
            let sellerA: { id: string }
            let sellerAHeaders: AuthHeaders
            let sellerB: { id: string }
            let sellerBHeaders: AuthHeaders
            let storeHeaders: AuthHeaders
            let region: { id: string }
            let salesChannel: { id: string }
            let productA: { id: string; variants: Array<{ id: string }> }
            let stockLocationA: { id: string; name: string }
            let stockLocationB: { id: string; name: string }
            let orderA: { id: string }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const sa = await createSellerUser(appContainer, {
                    email: "svsl-seller-a@test.com",
                    name: "SVSL Seller A",
                })
                sellerA = sa.seller
                sellerAHeaders = sa.headers

                const sb = await createSellerUser(appContainer, {
                    email: "svsl-seller-b@test.com",
                    name: "SVSL Seller B",
                })
                sellerB = sb.seller
                sellerBHeaders = sb.headers

                const customer = await createCustomerUser(appContainer, {
                    email: "svsl-customer@test.com",
                    first_name: "SVSL",
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
                        Modules.SALES_CHANNEL
                    )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "SVSL Store",
                })

                const regionModule =
                    appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "SVSL Region",
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

                // Seller A: product + stock location + shipping option
                const productResponseA = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: "SVSL Product A",
                        options: [{ title: "Size", values: ["M"] }],
                        variants: [
                            {
                                title: "Medium",
                                sku: "SVSL-A-MED",
                                options: { Size: "M" },
                                prices: [
                                    { currency_code: "usd", amount: 2000 },
                                ],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    sellerAHeaders
                )
                productA = productResponseA.data.product

                const prereqA = await setupShipping(
                    sellerAHeaders,
                    "a",
                    salesChannel.id
                )
                stockLocationA = prereqA.stockLocation

                // Seller B: a stock location only — proves scoping excludes it.
                const prereqB = await setupShipping(
                    sellerBHeaders,
                    "b",
                    salesChannel.id
                )
                stockLocationB = prereqB.stockLocation

                // Place an order for Seller A.
                orderA = await placeOrder(productA.variants[0].id)
            })

            let prereqCounter = 0

            const setupShipping = async (
                headers: AuthHeaders,
                prefix: string,
                salesChannelId: string
            ) => {
                const suffix = `_${prefix}_${Date.now()}_${++prereqCounter}`

                const locationResp = await api.post(
                    `/vendor/stock-locations`,
                    { name: `SVSL-${prefix}-loc${suffix}` },
                    headers
                )
                const stockLocation = locationResp.data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `SVSL-${prefix}-fs${suffix}`,
                        type: "shipping",
                    },
                    headers
                )

                const updatedLocation = await api.get(
                    `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
                    headers
                )
                const fulfillmentSet =
                    updatedLocation.data.stock_location.fulfillment_sets[0]

                const serviceZoneResp = await api.post(
                    `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                    {
                        name: `SVSL-${prefix}-sz${suffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers
                )
                const serviceZone =
                    serviceZoneResp.data.fulfillment_set.service_zones.find(
                        (z: { name: string }) =>
                            z.name === `SVSL-${prefix}-sz${suffix}`
                    )

                const shippingProfileResp = await api.post(
                    `/vendor/shipping-profiles`,
                    {
                        name: `SVSL-${prefix}-sp${suffix}`,
                        type: "default",
                    },
                    headers
                )
                const shippingProfile =
                    shippingProfileResp.data.shipping_profile

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
                        name: `SVSL-${prefix}-ship${suffix}`,
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

                return { stockLocation }
            }

            const placeOrder = async (variantId: string) => {
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
                    { variant_id: variantId, quantity: 1 },
                    storeHeaders
                )

                const shippingOptions = (
                    await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders
                    )
                ).data.shipping_options as Record<string, any[]>
                for (const [, opts] of Object.entries(shippingOptions)) {
                    if (opts.length > 0) {
                        await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            { option_id: opts[0].id },
                            storeHeaders
                        )
                    }
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

                const orderGroup = (
                    await api.post(
                        `/store/carts/${cart.id}/complete`,
                        {},
                        storeHeaders
                    )
                ).data.order_group

                const fullGroup = await api.get(
                    `/store/order-groups/${orderGroup.id}?fields=*orders`,
                    storeHeaders
                )
                return fullGroup.data.order_group.orders[0]
            }

            it("returns only stock locations linked to the order's seller", async () => {
                const response = await api.get(
                    `/admin/orders/${orderA.id}/seller-valid-stock-locations`,
                    adminHeaders
                )

                expect(response.status).toEqual(200)
                const ids = response.data.stock_locations.map(
                    (l: { id: string }) => l.id
                )
                expect(ids).toContain(stockLocationA.id)
                expect(ids).not.toContain(stockLocationB.id)
            })

            it("paginates via limit/offset", async () => {
                const response = await api.get(
                    `/admin/orders/${orderA.id}/seller-valid-stock-locations?limit=1`,
                    adminHeaders
                )

                expect(response.status).toEqual(200)
                expect(response.data.stock_locations.length).toBeLessThanOrEqual(1)
                expect(response.data.count).toBeGreaterThanOrEqual(1)
                expect(response.data.limit).toEqual(1)
            })

            it("returns 404 for an order that does not exist", async () => {
                const response = await api
                    .get(
                        `/admin/orders/order_does_not_exist/seller-valid-stock-locations`,
                        adminHeaders
                    )
                    .catch((err) => err.response)

                expect(response.status).toEqual(404)
            })
        })
    },
})
