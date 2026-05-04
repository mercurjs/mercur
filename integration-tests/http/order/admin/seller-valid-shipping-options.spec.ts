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
        describe("GET /admin/orders/:id/seller-valid-shipping-options", () => {
            let appContainer: MedusaContainer
            let sellerAHeaders: AuthHeaders
            let sellerBHeaders: AuthHeaders
            let storeHeaders: AuthHeaders
            let region: { id: string; currency_code: string }
            let salesChannel: { id: string }
            let productA: { variants: Array<{ id: string }> }
            let stockLocationA: { id: string }
            let stockLocationB: { id: string }
            let sellerAOutboundOptionId: string
            let sellerAReturnOptionId: string
            let sellerBOutboundOptionId: string
            let orderA: { id: string }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const sa = await createSellerUser(appContainer, {
                    email: "svso-seller-a@test.com",
                    name: "SVSO Seller A",
                })
                sellerAHeaders = sa.headers

                const sb = await createSellerUser(appContainer, {
                    email: "svso-seller-b@test.com",
                    name: "SVSO Seller B",
                })
                sellerBHeaders = sb.headers

                const customer = await createCustomerUser(appContainer, {
                    email: "svso-customer@test.com",
                    first_name: "SVSO",
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
                    name: "SVSO Store",
                })

                const regionModule =
                    appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "SVSO Region",
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

                const productResponseA = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: "SVSO Product A",
                        options: [{ title: "Size", values: ["M"] }],
                        variants: [
                            {
                                title: "Medium",
                                sku: "SVSO-A-MED",
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

                // Seller A: outbound shipping option
                const outboundA = await api.post(
                    `/vendor/shipping-options`,
                    shippingOptionBody(prereqA, "a-outbound", false),
                    sellerAHeaders
                )
                sellerAOutboundOptionId = outboundA.data.shipping_option.id

                // Seller A: return shipping option (same location)
                const returnA = await api.post(
                    `/vendor/shipping-options`,
                    shippingOptionBody(prereqA, "a-return", true),
                    sellerAHeaders
                )
                sellerAReturnOptionId = returnA.data.shipping_option.id

                const prereqB = await setupShipping(
                    sellerBHeaders,
                    "b",
                    salesChannel.id
                )
                stockLocationB = prereqB.stockLocation

                // Seller B: one outbound option
                const outboundB = await api.post(
                    `/vendor/shipping-options`,
                    shippingOptionBody(prereqB, "b-outbound", false),
                    sellerBHeaders
                )
                sellerBOutboundOptionId = outboundB.data.shipping_option.id

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
                    { name: `SVSO-${prefix}-loc${suffix}` },
                    headers
                )
                const stockLocation = locationResp.data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `SVSO-${prefix}-fs${suffix}`,
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
                        name: `SVSO-${prefix}-sz${suffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers
                )
                const serviceZone =
                    serviceZoneResp.data.fulfillment_set.service_zones.find(
                        (z: { name: string }) =>
                            z.name === `SVSO-${prefix}-sz${suffix}`
                    )

                const shippingProfileResp = await api.post(
                    `/vendor/shipping-profiles`,
                    {
                        name: `SVSO-${prefix}-sp${suffix}`,
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

                return { stockLocation, serviceZone, shippingProfile, suffix }
            }

            const shippingOptionBody = (
                prereq: {
                    serviceZone: { id: string }
                    shippingProfile: { id: string }
                    suffix: string
                },
                label: string,
                isReturn: boolean
            ) => ({
                name: `SVSO-${label}-${prereq.suffix}`,
                service_zone_id: prereq.serviceZone.id,
                shipping_profile_id: prereq.shippingProfile.id,
                provider_id: "manual_manual",
                price_type: "flat",
                type: {
                    label: isReturn ? "Return" : "Standard",
                    description: isReturn ? "Return" : "Standard",
                    code: isReturn ? "return" : "standard",
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
                        value: isReturn ? "true" : "false",
                        operator: "eq",
                    },
                ],
            })

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

            it("returns only shipping options belonging to the order's seller", async () => {
                const response = await api.get(
                    `/admin/orders/${orderA.id}/seller-valid-shipping-options?location_id=${stockLocationA.id}&is_return=false`,
                    adminHeaders
                )

                expect(response.status).toEqual(200)
                const ids = response.data.shipping_options.map(
                    (o: { id: string }) => o.id
                )
                expect(ids).toContain(sellerAOutboundOptionId)
                expect(ids).not.toContain(sellerBOutboundOptionId)
            })

            it("filters by is_return — outbound options excluded when is_return=true", async () => {
                const response = await api.get(
                    `/admin/orders/${orderA.id}/seller-valid-shipping-options?location_id=${stockLocationA.id}&is_return=true`,
                    adminHeaders
                )

                expect(response.status).toEqual(200)
                const ids = response.data.shipping_options.map(
                    (o: { id: string }) => o.id
                )
                expect(ids).toContain(sellerAReturnOptionId)
                expect(ids).not.toContain(sellerAOutboundOptionId)
            })

            it("filters by location_id — options bound to other locations excluded", async () => {
                const response = await api.get(
                    `/admin/orders/${orderA.id}/seller-valid-shipping-options?location_id=${stockLocationB.id}&is_return=false`,
                    adminHeaders
                )

                expect(response.status).toEqual(200)
                const ids = response.data.shipping_options.map(
                    (o: { id: string }) => o.id
                )
                // Seller A options are bound to location A, not B.
                expect(ids).not.toContain(sellerAOutboundOptionId)
                expect(ids).not.toContain(sellerAReturnOptionId)
            })

            it("returns 404 when the order has no order_seller link", async () => {
                const response = await api
                    .get(
                        `/admin/orders/order_does_not_exist/seller-valid-shipping-options?location_id=${stockLocationA.id}&is_return=false`,
                        adminHeaders
                    )
                    .catch((err) => err.response)

                expect(response.status).toEqual(404)
            })
        })
    },
})
