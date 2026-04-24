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

jest.setTimeout(240000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("admin write-guard matchers — seller scope", () => {
            let appContainer: MedusaContainer
            let sellerAHeaders: AuthHeaders
            let sellerBHeaders: AuthHeaders
            let storeHeaders: AuthHeaders
            let region: { id: string; currency_code: string }
            let salesChannel: { id: string }
            let stockLocationA: { id: string }
            let stockLocationB: { id: string }
            let sellerAReturnOptionId: string
            let sellerBReturnOptionId: string
            let orderA: { id: string }
            let returnForOrderA: { id: string }

            beforeAll(async () => {
                appContainer = getContainer()

                await createAdminUser(
                    dbConnection,
                    adminHeaders,
                    appContainer
                )

                const sa = await createSellerUser(appContainer, {
                    email: "svsm-seller-a@test.com",
                    name: "SVSM Seller A",
                })
                sellerAHeaders = sa.headers

                const sb = await createSellerUser(appContainer, {
                    email: "svsm-seller-b@test.com",
                    name: "SVSM Seller B",
                })
                sellerBHeaders = sb.headers

                const customer = await createCustomerUser(appContainer, {
                    email: "svsm-customer@test.com",
                    first_name: "SVSM",
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
                    name: "SVSM Store",
                })

                const regionModule =
                    appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "SVSM Region",
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

                const productA = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: "SVSM Product A",
                            options: [{ title: "Size", values: ["M"] }],
                            variants: [
                                {
                                    title: "Medium",
                                    sku: "SVSM-A",
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
                ).data.product

                const prereqA = await setupStockLocation(
                    sellerAHeaders,
                    "a",
                    salesChannel.id
                )
                stockLocationA = prereqA.stockLocation
                await api.post(
                    `/vendor/shipping-options`,
                    shippingOptionBody(prereqA, "a-outbound", false),
                    sellerAHeaders
                )
                sellerAReturnOptionId = (
                    await api.post(
                        `/vendor/shipping-options`,
                        shippingOptionBody(prereqA, "a-return", true),
                        sellerAHeaders
                    )
                ).data.shipping_option.id

                const prereqB = await setupStockLocation(
                    sellerBHeaders,
                    "b",
                    salesChannel.id
                )
                stockLocationB = prereqB.stockLocation
                sellerBReturnOptionId = (
                    await api.post(
                        `/vendor/shipping-options`,
                        shippingOptionBody(prereqB, "b-return", true),
                        sellerBHeaders
                    )
                ).data.shipping_option.id

                orderA = await createFulfilledOrder(
                    productA.variants[0].id,
                    stockLocationA.id,
                    sellerAHeaders
                )

                // Create a pending return on order A so we can target
                // its shipping-method endpoint.
                returnForOrderA = (
                    await api.post(
                        `/vendor/returns`,
                        {
                            order_id: orderA.id,
                            description: "setup return for shipping-method tests",
                        },
                        sellerAHeaders
                    )
                ).data.return
            })

            let prereqCounter = 0

            const setupStockLocation = async (
                headers: AuthHeaders,
                prefix: string,
                salesChannelId: string
            ) => {
                const suffix = `_${prefix}_${Date.now()}_${++prereqCounter}`

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `SVSM-${prefix}-loc${suffix}` },
                        headers
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `SVSM-${prefix}-fs${suffix}`,
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
                        name: `SVSM-${prefix}-sz${suffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers
                )
                const serviceZone =
                    serviceZoneResp.data.fulfillment_set.service_zones.find(
                        (z: { name: string }) =>
                            z.name === `SVSM-${prefix}-sz${suffix}`
                    )

                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: `SVSM-${prefix}-sp${suffix}`,
                            type: "default",
                        },
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
                name: `SVSM-${label}-${prereq.suffix}`,
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

            const createFulfilledOrder = async (
                variantId: string,
                stockLocationId: string,
                sellerHeaders: AuthHeaders
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

                const order = (
                    await api.get(
                        `/store/order-groups/${orderGroup.id}?fields=*orders`,
                        storeHeaders
                    )
                ).data.order_group.orders[0]

                const orderWithItems = (
                    await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        sellerHeaders
                    )
                ).data.order

                const fulfillment = (
                    await api.post(
                        `/vendor/orders/${order.id}/fulfillments`,
                        {
                            items: orderWithItems.items.map(
                                (item: { id: string; quantity: number }) => ({
                                    id: item.id,
                                    quantity: item.quantity,
                                })
                            ),
                            requires_shipping: true,
                            location_id: stockLocationId,
                        },
                        sellerHeaders
                    )
                ).data.fulfillment

                await api.post(
                    `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/shipments`,
                    {
                        items: orderWithItems.items.map(
                            (item: { id: string; quantity: number }) => ({
                                id: item.id,
                                quantity: item.quantity,
                            })
                        ),
                    },
                    sellerHeaders
                )

                await api.post(
                    `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/mark-as-delivered`,
                    {},
                    sellerHeaders
                )

                return order
            }

            describe("POST /admin/returns — location seller scope", () => {
                it("rejects a cross-seller location_id with 403 + LOCATION_NOT_SELLER_VALID", async () => {
                    const response = await api
                        .post(
                            `/admin/returns`,
                            {
                                order_id: orderA.id,
                                location_id: stockLocationB.id,
                                description: "cross-seller location attempt",
                            },
                            adminHeaders
                        )
                        .catch((err) => err.response)

                    expect(response.status).toEqual(403)
                    expect(response.data.code).toEqual(
                        "LOCATION_NOT_SELLER_VALID"
                    )
                })
            })

            describe("POST /admin/returns/:id/shipping-method — shipping option seller scope", () => {
                it("rejects a cross-seller shipping_option_id with 403 + SHIPPING_OPTION_NOT_SELLER_VALID", async () => {
                    const response = await api
                        .post(
                            `/admin/returns/${returnForOrderA.id}/shipping-method`,
                            {
                                shipping_option_id: sellerBReturnOptionId,
                            },
                            adminHeaders
                        )
                        .catch((err) => err.response)

                    expect(response.status).toEqual(403)
                    expect(response.data.code).toEqual(
                        "SHIPPING_OPTION_NOT_SELLER_VALID"
                    )
                })
            })
        })
    },
})
