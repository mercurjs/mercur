import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Store - Product Offers", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let salesChannel: any

            const seedSellerCatalog = async (opts: {
                email: string
                name: string
                stocked: number
                required_quantity?: number
                price_amount?: number
            }) => {
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                const headers = result.headers

                const locationResp = await api.post(
                    `/vendor/stock-locations`,
                    { name: `${opts.name} Warehouse` },
                    headers
                )
                const stockLocation = locationResp.data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    headers
                )

                const inventoryItemResp = await api.post(
                    `/vendor/inventory-items`,
                    { title: `${opts.name} Inventory` },
                    headers
                )
                const inventoryItem = inventoryItemResp.data.inventory_item

                await api.post(
                    `/vendor/inventory-items/${inventoryItem.id}/location-levels`,
                    { location_id: stockLocation.id, stocked_quantity: opts.stocked },
                    headers
                )

                const productResp = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: `${opts.name} Product`,
                        options: [{ title: "Default", values: ["Default"] }],
                        variants: [
                            {
                                title: "Default",
                                sku: `${opts.name.replace(/\s/g, "")}-SKU`,
                                options: { Default: "Default" },
                                prices: [{ currency_code: "usd", amount: 1000 }],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    headers
                )
                const product = productResp.data.product

                const shippingProfileResp = await api.post(
                    `/vendor/shipping-profiles`,
                    { name: `${opts.name} Profile`, type: "default" },
                    headers
                )
                const shippingProfile = shippingProfileResp.data.shipping_profile

                const offerResp = await api.post(
                    `/vendor/offers`,
                    {
                        sku: `${opts.name.replace(/\s/g, "")}-OFFER`,
                        variant_id: product.variants[0].id,
                        shipping_profile_id: shippingProfile.id,
                        inventory_items: [
                            {
                                inventory_item_id: inventoryItem.id,
                                required_quantity: opts.required_quantity ?? 1,
                            },
                        ],
                        prices: [
                            {
                                amount: opts.price_amount ?? 2000,
                                currency_code: "usd",
                            },
                        ],
                    },
                    headers
                )

                return {
                    headers,
                    stockLocation,
                    inventoryItem,
                    product,
                    shippingProfile,
                    offer: offerResp.data.offer,
                }
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const salesChannelModule =
                    appContainer.resolve<ISalesChannelModuleService>(
                        Modules.SALES_CHANNEL
                    )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "Default Store",
                })

                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
            })

            it("should attach per-variant offers list with seller, price, stock_status, sku", async () => {
                const { product, offer } = await seedSellerCatalog({
                    email: "seller-a@test.com",
                    name: "Seller A",
                    stocked: 10,
                    price_amount: 2500,
                })

                const response = await api.get(
                    `/store/products/${product.id}?sales_channel_id=${salesChannel.id}&currency_code=usd`,
                    storeHeaders
                )

                expect(response.status).toEqual(200)
                const variant = response.data.product.variants[0]
                expect(variant.offers).toBeDefined()
                expect(variant.offers).toHaveLength(1)
                expect(variant.offers[0]).toEqual(
                    expect.objectContaining({
                        id: offer.id,
                        sku: "SellerA-OFFER",
                        price: 2500,
                        currency_code: "usd",
                        stock_status: "in_stock",
                    })
                )
                expect(variant.offers[0].seller).toEqual(
                    expect.objectContaining({ name: "Seller A" })
                )
            })

            it("should filter out offers with zero effective stock", async () => {
                const { product } = await seedSellerCatalog({
                    email: "seller-empty@test.com",
                    name: "Seller Empty",
                    stocked: 0,
                })

                const response = await api.get(
                    `/store/products/${product.id}?sales_channel_id=${salesChannel.id}&currency_code=usd`,
                    storeHeaders
                )

                expect(response.status).toEqual(200)
                expect(response.data.product.variants[0].offers).toEqual([])
            })

            it("should compute effective stock as floor(stocked / required_quantity)", async () => {
                const { product } = await seedSellerCatalog({
                    email: "seller-ratio@test.com",
                    name: "Seller Ratio",
                    stocked: 8,
                    required_quantity: 3,
                })

                const response = await api.get(
                    `/store/products/${product.id}?sales_channel_id=${salesChannel.id}&currency_code=usd`,
                    storeHeaders
                )

                // floor(8 / 3) = 2 → low_stock (< 5)
                expect(response.data.product.variants[0].offers[0].stock_status).toEqual(
                    "low_stock"
                )
            })

            it("should expose offers from multiple sellers on the same variant sorted by price ASC", async () => {
                const sellerA = await createSellerUser(appContainer, {
                    email: "shared-a@test.com",
                    name: "Shared A",
                })
                const sellerB = await createSellerUser(appContainer, {
                    email: "shared-b@test.com",
                    name: "Shared B",
                })

                // Seed shared variant via seller A.
                const locationA = await api.post(
                    `/vendor/stock-locations`,
                    { name: "A WH" },
                    sellerA.headers
                )
                await api.post(
                    `/vendor/stock-locations/${locationA.data.stock_location.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    sellerA.headers
                )
                const invA = await api.post(
                    `/vendor/inventory-items`,
                    { title: "A inv" },
                    sellerA.headers
                )
                await api.post(
                    `/vendor/inventory-items/${invA.data.inventory_item.id}/location-levels`,
                    {
                        location_id: locationA.data.stock_location.id,
                        stocked_quantity: 20,
                    },
                    sellerA.headers
                )
                const productResp = await api.post(
                    `/vendor/products`,
                    {
                        status: "published",
                        title: "Shared Product",
                        options: [{ title: "Default", values: ["Default"] }],
                        variants: [
                            {
                                title: "Default",
                                sku: "SHARED-VARIANT-SKU",
                                options: { Default: "Default" },
                                prices: [{ currency_code: "usd", amount: 1000 }],
                                manage_inventory: false,
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                    },
                    sellerA.headers
                )
                const product = productResp.data.product
                const shipA = await api.post(
                    `/vendor/shipping-profiles`,
                    { name: "A Profile", type: "default" },
                    sellerA.headers
                )
                const offerAResp = await api.post(
                    `/vendor/offers`,
                    {
                        sku: "OFFER-A",
                        variant_id: product.variants[0].id,
                        shipping_profile_id: shipA.data.shipping_profile.id,
                        inventory_items: [
                            { inventory_item_id: invA.data.inventory_item.id },
                        ],
                        prices: [{ amount: 3000, currency_code: "usd" }],
                    },
                    sellerA.headers
                )

                // Seller B uses its own inventory item against the same variant.
                const locationB = await api.post(
                    `/vendor/stock-locations`,
                    { name: "B WH" },
                    sellerB.headers
                )
                await api.post(
                    `/vendor/stock-locations/${locationB.data.stock_location.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    sellerB.headers
                )
                const invB = await api.post(
                    `/vendor/inventory-items`,
                    { title: "B inv" },
                    sellerB.headers
                )
                await api.post(
                    `/vendor/inventory-items/${invB.data.inventory_item.id}/location-levels`,
                    {
                        location_id: locationB.data.stock_location.id,
                        stocked_quantity: 20,
                    },
                    sellerB.headers
                )
                const shipB = await api.post(
                    `/vendor/shipping-profiles`,
                    { name: "B Profile", type: "default" },
                    sellerB.headers
                )
                const offerBResp = await api.post(
                    `/vendor/offers`,
                    {
                        sku: "OFFER-B",
                        variant_id: product.variants[0].id,
                        shipping_profile_id: shipB.data.shipping_profile.id,
                        inventory_items: [
                            { inventory_item_id: invB.data.inventory_item.id },
                        ],
                        prices: [{ amount: 2000, currency_code: "usd" }],
                    },
                    sellerB.headers
                )

                const response = await api.get(
                    `/store/products/${product.id}?sales_channel_id=${salesChannel.id}&currency_code=usd`,
                    storeHeaders
                )

                const offers = response.data.product.variants[0].offers
                expect(offers).toHaveLength(2)
                // Ordered by price ASC.
                expect(offers[0].id).toEqual(offerBResp.data.offer.id)
                expect(offers[0].price).toEqual(2000)
                expect(offers[1].id).toEqual(offerAResp.data.offer.id)
                expect(offers[1].price).toEqual(3000)
            })

            it("should filter offers by sales_channel allowed locations when sales_channel_id is provided", async () => {
                // Seed an offer whose only inventory level lives at a location not linked to the channel.
                const sellerResult = await createSellerUser(appContainer, {
                    email: "off-channel@test.com",
                    name: "Off Channel",
                })
                const headers = sellerResult.headers

                const location = await api.post(
                    `/vendor/stock-locations`,
                    { name: "Detached WH" },
                    headers
                )
                // Do NOT link this stock location to the sales channel.
                const inv = await api.post(
                    `/vendor/inventory-items`,
                    { title: "Detached inv" },
                    headers
                )
                await api.post(
                    `/vendor/inventory-items/${inv.data.inventory_item.id}/location-levels`,
                    {
                        location_id: location.data.stock_location.id,
                        stocked_quantity: 50,
                    },
                    headers
                )
                const product = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: "Channel Filter Product",
                            options: [{ title: "Default", values: ["Default"] }],
                            variants: [
                                {
                                    title: "Default",
                                    sku: "CHFILTER-SKU",
                                    options: { Default: "Default" },
                                    prices: [{ currency_code: "usd", amount: 1000 }],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        headers
                    )
                ).data.product
                const ship = await api.post(
                    `/vendor/shipping-profiles`,
                    { name: "P", type: "default" },
                    headers
                )
                await api.post(
                    `/vendor/offers`,
                    {
                        sku: "DETACHED-OFFER",
                        variant_id: product.variants[0].id,
                        shipping_profile_id: ship.data.shipping_profile.id,
                        inventory_items: [
                            { inventory_item_id: inv.data.inventory_item.id },
                        ],
                        prices: [{ amount: 2000, currency_code: "usd" }],
                    },
                    headers
                )

                const response = await api.get(
                    `/store/products/${product.id}?sales_channel_id=${salesChannel.id}&currency_code=usd`,
                    storeHeaders
                )

                expect(response.data.product.variants[0].offers).toEqual([])
            })
        })
    },
})
