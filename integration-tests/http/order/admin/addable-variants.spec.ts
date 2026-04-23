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

jest.setTimeout(180000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("GET /admin/orders/:id/addable-variants", () => {
            let appContainer: MedusaContainer
            let sellerAHeaders: AuthHeaders
            let sellerBHeaders: AuthHeaders
            let storeHeaders: AuthHeaders
            let region: { id: string; currency_code: string }
            let salesChannel: { id: string }
            let stockLocationA: { id: string }
            let orderA: { id: string }
            let variantOkId: string
            let variantNoPriceId: string
            let variantNoInventoryId: string
            let variantSellerBId: string
            let variantWithSkuId: string

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const sa = await createSellerUser(appContainer, {
                    email: "sav-seller-a@test.com",
                    name: "SAV Seller A",
                })
                sellerAHeaders = sa.headers

                const sb = await createSellerUser(appContainer, {
                    email: "sav-seller-b@test.com",
                    name: "SAV Seller B",
                })
                sellerBHeaders = sb.headers

                const customer = await createCustomerUser(appContainer, {
                    email: "sav-customer@test.com",
                    first_name: "SAV",
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
                    name: "SAV Store",
                })

                const regionModule =
                    appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: "SAV Region",
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

                // Seller A: create 4 products with distinct eligibility shapes.
                // "ok" — usd price + manage_inventory:false (always available).
                const okResp = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: "SAV Product OK",
                        options: [{ title: "Size", values: ["M"] }],
                        variants: [
                            {
                                title: "Medium",
                                sku: "SAV-A-OK",
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
                variantOkId = okResp.data.product.variants[0].id

                // "no_price" — priced in eur only, order is usd.
                const noPriceResp = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: "SAV Product NoPrice",
                        options: [{ title: "Size", values: ["M"] }],
                        variants: [
                            {
                                title: "Medium",
                                sku: "SAV-A-NOPRICE",
                                options: { Size: "M" },
                                prices: [
                                    { currency_code: "eur", amount: 1500 },
                                ],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    sellerAHeaders
                )
                variantNoPriceId = noPriceResp.data.product.variants[0].id

                // "no_inventory" — manage_inventory:true with zero stock.
                const noInventoryResp = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: "SAV Product NoInventory",
                        options: [{ title: "Size", values: ["M"] }],
                        variants: [
                            {
                                title: "Medium",
                                sku: "SAV-A-NOINV",
                                options: { Size: "M" },
                                prices: [
                                    { currency_code: "usd", amount: 1800 },
                                ],
                                manage_inventory: true,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    sellerAHeaders
                )
                variantNoInventoryId =
                    noInventoryResp.data.product.variants[0].id

                // Stock location for seller A — used by the ok variant
                // (manage_inventory:false so no inventory_level needed) and
                // to prove the no_inventory variant has zero reachable stock.
                const prereqA = await setupStockLocation(
                    sellerAHeaders,
                    "a",
                    salesChannel.id
                )
                stockLocationA = prereqA.stockLocation

                // Needed for shipping methods on the seed order.
                await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "SAV-a-ship",
                        service_zone_id: prereqA.serviceZone.id,
                        shipping_profile_id: prereqA.shippingProfile.id,
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
                    sellerAHeaders
                )

                // Variant with a searchable SKU (for the search test). Reuses
                // the "ok" shape.
                const searchableResp = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: "SAV Searchable Shirt",
                        options: [{ title: "Size", values: ["M"] }],
                        variants: [
                            {
                                title: "Medium",
                                sku: "UNIQUE-SKU-12345",
                                options: { Size: "M" },
                                prices: [
                                    { currency_code: "usd", amount: 2500 },
                                ],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    sellerAHeaders
                )
                variantWithSkuId = searchableResp.data.product.variants[0].id

                // Seller B: one variant — must never appear in seller A's
                // addable catalog.
                await setupStockLocation(
                    sellerBHeaders,
                    "b",
                    salesChannel.id
                )
                const sellerBResp = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: "SAV Product SellerB",
                        options: [{ title: "Size", values: ["M"] }],
                        variants: [
                            {
                                title: "Medium",
                                sku: "SAV-B",
                                options: { Size: "M" },
                                prices: [
                                    { currency_code: "usd", amount: 3000 },
                                ],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    sellerBHeaders
                )
                variantSellerBId = sellerBResp.data.product.variants[0].id

                orderA = await placeOrder(variantOkId)
            })

            let prereqCounter = 0

            const setupStockLocation = async (
                headers: AuthHeaders,
                prefix: string,
                salesChannelId: string
            ) => {
                const suffix = `_${prefix}_${Date.now()}_${++prereqCounter}`

                const locationResp = await api.post(
                    `/vendor/stock-locations`,
                    { name: `SAV-${prefix}-loc${suffix}` },
                    headers
                )
                const stockLocation = locationResp.data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `SAV-${prefix}-fs${suffix}`,
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
                        name: `SAV-${prefix}-sz${suffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers
                )
                const serviceZone =
                    serviceZoneResp.data.fulfillment_set.service_zones.find(
                        (z: { name: string }) =>
                            z.name === `SAV-${prefix}-sz${suffix}`
                    )

                const shippingProfileResp = await api.post(
                    `/vendor/shipping-profiles`,
                    {
                        name: `SAV-${prefix}-sp${suffix}`,
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

                return { stockLocation, serviceZone, shippingProfile }
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

            type VariantRow = {
                id: string
                sku?: string
                title?: string
                eligibility?: {
                    can_add: boolean
                    reason: "ok" | "no_price" | "no_inventory"
                }
            }

            const fetchVariants = async (qs = "") => {
                const response = await api.get(
                    `/admin/orders/${orderA.id}/addable-variants${qs}`,
                    adminHeaders
                )
                expect(response.status).toEqual(200)
                return response.data.variants as VariantRow[]
            }

            it("excludes variants owned by another seller", async () => {
                const variants = await fetchVariants()
                const ids = variants.map((v) => v.id)
                expect(ids).toContain(variantOkId)
                expect(ids).not.toContain(variantSellerBId)
            })

            it("flags ok when the variant has both valid price and available inventory", async () => {
                const variants = await fetchVariants()
                const ok = variants.find((v) => v.id === variantOkId)
                expect(ok?.eligibility).toEqual({
                    can_add: true,
                    reason: "ok",
                })
            })

            it("flags no_price when the variant has no price for the order's currency", async () => {
                const variants = await fetchVariants()
                const row = variants.find((v) => v.id === variantNoPriceId)
                expect(row?.eligibility).toEqual({
                    can_add: false,
                    reason: "no_price",
                })
            })

            it("flags no_inventory when a managed-inventory variant has zero stock in the seller's locations", async () => {
                const variants = await fetchVariants()
                const row = variants.find(
                    (v) => v.id === variantNoInventoryId
                )
                expect(row?.eligibility).toEqual({
                    can_add: false,
                    reason: "no_inventory",
                })
            })

            it("narrows results with search query matching SKU", async () => {
                const variants = await fetchVariants(
                    `?search=UNIQUE-SKU-12345`
                )
                expect(variants.length).toBeGreaterThanOrEqual(1)
                expect(variants.map((v) => v.id)).toContain(variantWithSkuId)
                // Non-matching variants are filtered out of the page.
                expect(variants.map((v) => v.id)).not.toContain(variantOkId)
            })
        })
    },
})
