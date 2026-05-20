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
import { createSellerUser } from "../../../helpers/create-seller-user"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Store - Cart with Offers", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let region: any
            let salesChannel: any

            type SellerSeed = Awaited<ReturnType<typeof seedSellerOffer>>

            const seedSellerOffer = async (opts: {
                email: string
                name: string
                stocked: number
                offerPrice: number
                offerSku?: string
                required_quantity?: number
            }) => {
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                const headers = result.headers

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `${opts.name} WH` },
                        headers
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    headers
                )

                const inventoryItem = (
                    await api.post(
                        `/vendor/inventory-items`,
                        { title: `${opts.name} Inv` },
                        headers
                    )
                ).data.inventory_item

                await api.post(
                    `/vendor/inventory-items/${inventoryItem.id}/location-levels`,
                    {
                        location_id: stockLocation.id,
                        stocked_quantity: opts.stocked,
                    },
                    headers
                )

                const product = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: `${opts.name} Product`,
                            options: [{ title: "Default", values: ["Default"] }],
                            variants: [
                                {
                                    title: "Default",
                                    sku: `${opts.email}-V-SKU`,
                                    options: { Default: "Default" },
                                    prices: [
                                        { currency_code: "usd", amount: 1000 },
                                    ],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        headers
                    )
                ).data.product

                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: `${opts.name} Profile`, type: "default" },
                        headers
                    )
                ).data.shipping_profile

                const offer = (
                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: opts.offerSku ?? `${opts.name.replace(/\s/g, "")}-OFFER`,
                            variant_id: product.variants[0].id,
                            shipping_profile_id: shippingProfile.id,
                            inventory_items: [
                                {
                                    inventory_item_id: inventoryItem.id,
                                    required_quantity:
                                        opts.required_quantity ?? 1,
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
                    headers,
                    sellerId: result.seller.id,
                    product,
                    variant: product.variants[0],
                    inventoryItem,
                    stockLocation,
                    offer,
                }
            }

            const createCart = async () => {
                const r = await api.post(
                    `/store/carts`,
                    {
                        region_id: region.id,
                        sales_channel_id: salesChannel.id,
                        currency_code: "usd",
                    },
                    storeHeaders
                )
                return r.data.cart
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

                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
            })

            describe("POST /store/carts/:id/line-items", () => {
                it("should reject add-to-cart when offer_id is missing", async () => {
                    const { variant } = await seedSellerOffer({
                        email: "missing-offer@test.com",
                        name: "Missing Offer",
                        stocked: 10,
                        offerPrice: 2500,
                    })

                    const cart = await createCart()

                    const response = await api
                        .post(
                            `/store/carts/${cart.id}/line-items`,
                            {
                                variant_id: variant.id,
                                quantity: 1,
                            },
                            storeHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should snapshot offer price as unit_price + is_custom_price=true on the cart line", async () => {
                    const seed: SellerSeed = await seedSellerOffer({
                        email: "snapshot@test.com",
                        name: "Snapshot",
                        stocked: 10,
                        offerPrice: 4200,
                    })

                    const cart = await createCart()

                    const addResp = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            offer_id: seed.offer.id,
                            quantity: 2,
                        },
                        storeHeaders
                    )

                    expect(addResp.status).toEqual(200)
                    expect(addResp.data.cart.items).toHaveLength(1)
                    const line = addResp.data.cart.items[0]
                    expect(line.variant_id).toEqual(seed.variant.id)
                    expect(line.unit_price).toEqual(4200)
                    expect(line.is_custom_price).toEqual(true)
                    expect(line.quantity).toEqual(2)
                })

                it("should keep sibling offers on the same variant as separate cart lines", async () => {
                    // One seller, one variant, two offers with distinct skus + prices.
                    const result = await createSellerUser(appContainer, {
                        email: "siblings@test.com",
                        name: "Siblings",
                    })
                    const headers = result.headers

                    const stockLocation = (
                        await api.post(
                            `/vendor/stock-locations`,
                            { name: "Siblings WH" },
                            headers
                        )
                    ).data.stock_location
                    await api.post(
                        `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                        { add: [salesChannel.id] },
                        headers
                    )
                    const inventoryItem = (
                        await api.post(
                            `/vendor/inventory-items`,
                            { title: "Siblings Inv" },
                            headers
                        )
                    ).data.inventory_item
                    await api.post(
                        `/vendor/inventory-items/${inventoryItem.id}/location-levels`,
                        { location_id: stockLocation.id, stocked_quantity: 50 },
                        headers
                    )
                    const product = (
                        await api.post(
                            `/vendor/products`,
                            {
                                status: "published",
                                title: "Siblings Product",
                                options: [
                                    { title: "Default", values: ["Default"] },
                                ],
                                variants: [
                                    {
                                        title: "Default",
                                        sku: "SIBLINGS-V",
                                        options: { Default: "Default" },
                                        prices: [
                                            {
                                                currency_code: "usd",
                                                amount: 1000,
                                            },
                                        ],
                                        manage_inventory: false,
                                    },
                                ],
                                sales_channels: [{ id: salesChannel.id }],
                            },
                            headers
                        )
                    ).data.product
                    const shippingProfile = (
                        await api.post(
                            `/vendor/shipping-profiles`,
                            { name: "Siblings Profile", type: "default" },
                            headers
                        )
                    ).data.shipping_profile

                    const offerSingle = (
                        await api.post(
                            `/vendor/offers`,
                            {
                                sku: "PACK-SINGLE",
                                variant_id: product.variants[0].id,
                                shipping_profile_id: shippingProfile.id,
                                inventory_items: [
                                    {
                                        inventory_item_id: inventoryItem.id,
                                        required_quantity: 1,
                                    },
                                ],
                                prices: [
                                    { amount: 2000, currency_code: "usd" },
                                ],
                            },
                            headers
                        )
                    ).data.offer
                    const offerBundle = (
                        await api.post(
                            `/vendor/offers`,
                            {
                                sku: "PACK-BUNDLE",
                                variant_id: product.variants[0].id,
                                shipping_profile_id: shippingProfile.id,
                                inventory_items: [
                                    {
                                        inventory_item_id: inventoryItem.id,
                                        required_quantity: 5,
                                    },
                                ],
                                prices: [
                                    { amount: 8000, currency_code: "usd" },
                                ],
                            },
                            headers
                        )
                    ).data.offer

                    const cart = await createCart()

                    await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            offer_id: offerSingle.id,
                            quantity: 1,
                        },
                        storeHeaders
                    )
                    const addBundle = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            offer_id: offerBundle.id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    expect(addBundle.status).toEqual(200)
                    expect(addBundle.data.cart.items).toHaveLength(2)

                    const prices = addBundle.data.cart.items
                        .map((i: any) => i.unit_price)
                        .sort((a: number, b: number) => a - b)
                    expect(prices).toEqual([2000, 8000])
                })

                it("should materialize a cart.LineItem ↔ Offer link row keyed by line_item_id", async () => {
                    const seed: SellerSeed = await seedSellerOffer({
                        email: "link@test.com",
                        name: "Link",
                        stocked: 10,
                        offerPrice: 3000,
                    })

                    const cart = await createCart()

                    const addResp = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            offer_id: seed.offer.id,
                            quantity: 1,
                        },
                        storeHeaders
                    )
                    const line = addResp.data.cart.items[0]

                    const query = appContainer.resolve(
                        ContainerRegistrationKeys.QUERY
                    )
                    const { data: linkedOffers } = await query.graph({
                        entity: "line_item",
                        fields: ["id", "offer.id", "offer.sku"],
                        filters: { id: line.id },
                    })

                    expect(linkedOffers).toHaveLength(1)
                    expect((linkedOffers[0] as any).offer).toEqual(
                        expect.objectContaining({
                            id: seed.offer.id,
                        })
                    )
                })

                it("should decorate the cart line with offer sku (overrides variant_sku)", async () => {
                    const seed: SellerSeed = await seedSellerOffer({
                        email: "decorate@test.com",
                        name: "Decorate",
                        stocked: 10,
                        offerPrice: 3500,
                        offerSku: "DECORATE-OFFER-SKU",
                    })

                    const cart = await createCart()

                    const addResp = await api.post(
                        `/store/carts/${cart.id}/line-items`,
                        {
                            offer_id: seed.offer.id,
                            quantity: 1,
                        },
                        storeHeaders
                    )

                    const line = addResp.data.cart.items[0]
                    expect(line.variant_sku).toEqual("DECORATE-OFFER-SKU")
                })

                it("should reject add-to-cart with a non-existent offer_id", async () => {
                    const cart = await createCart()

                    const response = await api
                        .post(
                            `/store/carts/${cart.id}/line-items`,
                            {
                                offer_id: "offer_does_not_exist",
                                quantity: 1,
                            },
                            storeHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
