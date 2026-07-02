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
import { createVendorProduct } from "../../../helpers/create-product"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

const approveSeller = async (container: MedusaContainer, sellerId: string) => {
    const sellerModule: any = container.resolve(MercurModules.SELLER)
    await sellerModule.updateSellers({
        id: sellerId,
        status: SellerStatus.OPEN,
    })
}

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Store - Offers", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let region: any
            let salesChannel: any

            let seedCounter = 0
            const seedSellerOffer = async (opts: {
                email: string
                name: string
                stocked: number
                offerPrice: number
                approve?: boolean
                published?: boolean
                required_quantity?: number
                productId?: string
                variantId?: string
                linkLocationToChannel?: boolean
            }) => {
                const tag = `s${++seedCounter}${Date.now()}`
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                if (opts.approve !== false) {
                    await approveSeller(appContainer, (result.seller as any).id)
                }
                const headers = result.headers

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `${opts.name} WH ${tag}` },
                        headers
                    )
                ).data.stock_location
                const stockLocationId = stockLocation.id

                if (opts.linkLocationToChannel !== false) {
                    await api.post(
                        `/vendor/stock-locations/${stockLocationId}/sales-channels`,
                        { add: [salesChannel.id] },
                        headers
                    )
                }

                let productId = opts.productId
                let variantId = opts.variantId
                if (!productId || !variantId) {
                    const product = await createVendorProduct(api, headers, {
                        status:
                            opts.published === false ? "draft" : "published",
                        title: `${opts.name} Product ${tag}`,
                        sku: `${opts.email}-V-SKU-${tag}`,
                    })

                    await api.post(
                        `/vendor/sales-channels/${salesChannel.id}/products`,
                        { add: [product.id] },
                        headers
                    )

                    productId = product.id
                    variantId = product.variants[0].id
                }

                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: `${opts.name} Profile ${tag}`, type: "default" },
                        headers
                    )
                ).data.shipping_profile

                const offer = (
                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: `${opts.name.replace(/\s/g, "")}-OFFER-${tag}`,
                            variant_id: variantId,
                            shipping_profile_id: shippingProfile.id,
                            inventory_items: [
                                {
                                    title: `${opts.name} Inv ${tag}`,
                                    required_quantity:
                                        opts.required_quantity ?? 1,
                                    stock_levels: [
                                        {
                                            location_id: stockLocationId,
                                            stocked_quantity: opts.stocked,
                                        },
                                    ],
                                },
                            ],
                            prices: [
                                { amount: opts.offerPrice, currency_code: "usd" },
                            ],
                        },
                        headers
                    )
                ).data.offer

                return {
                    headers,
                    sellerId: result.seller.id as string,
                    productId: productId as string,
                    variantId: variantId as string,
                    offer,
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

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Test Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey: apiKey })

                const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
                await link.create({
                    [Modules.API_KEY]: { publishable_key_id: apiKey.id },
                    [Modules.SALES_CHANNEL]: {
                        sales_channel_id: salesChannel.id,
                    },
                })
            })

            describe("GET /store/offers", () => {
                it("returns an open seller's offer for a product with calculated_price", async () => {
                    const seed = await seedSellerOffer({
                        email: "happy@test.com",
                        name: "Happy",
                        stocked: 10,
                        offerPrice: 2500,
                    })

                    const response = await api.get(
                        `/store/offers?product_id=${seed.productId}&fields=+calculated_price&region_id=${region.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offers).toHaveLength(1)
                    expect(response.data.offers[0]).toEqual(
                        expect.objectContaining({
                            id: seed.offer.id,
                            product_id: seed.productId,
                            variant_id: seed.variantId,
                        })
                    )
                    expect(
                        response.data.offers[0].calculated_price.calculated_amount
                    ).toEqual(2500)
                    expect(
                        response.data.offers[0].calculated_price.currency_code
                    ).toEqual("usd")
                })

                it("filters offers by variant_id", async () => {
                    const seed = await seedSellerOffer({
                        email: "byvariant@test.com",
                        name: "ByVariant",
                        stocked: 5,
                        offerPrice: 1200,
                    })

                    const response = await api.get(
                        `/store/offers?variant_id=${seed.variantId}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offers).toHaveLength(1)
                    expect(response.data.offers[0].id).toEqual(seed.offer.id)
                })

                it("returns sibling offers from two sellers on one variant, each with its own price", async () => {
                    const seedA = await seedSellerOffer({
                        email: "expensive@test.com",
                        name: "Expensive",
                        stocked: 10,
                        offerPrice: 5000,
                    })
                    const seedB = await seedSellerOffer({
                        email: "cheap@test.com",
                        name: "Cheap",
                        stocked: 10,
                        offerPrice: 2000,
                        productId: seedA.productId,
                        variantId: seedA.variantId,
                    })

                    const response = await api.get(
                        `/store/offers?variant_id=${seedA.variantId}&fields=+calculated_price&region_id=${region.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offers).toHaveLength(2)
                    const byId = new Map<string, any>(
                        response.data.offers.map((o: any) => [o.id, o])
                    )
                    expect(
                        byId.get(seedA.offer.id).calculated_price
                            .calculated_amount
                    ).toEqual(5000)
                    expect(
                        byId.get(seedB.offer.id).calculated_price
                            .calculated_amount
                    ).toEqual(2000)
                })

                it("prices offers on different products in a single calculatePrices call", async () => {
                    const seedA = await seedSellerOffer({
                        email: "batch-a@test.com",
                        name: "BatchA",
                        stocked: 10,
                        offerPrice: 1000,
                    })
                    const seedB = await seedSellerOffer({
                        email: "batch-b@test.com",
                        name: "BatchB",
                        stocked: 10,
                        offerPrice: 2000,
                    })

                    const pricingModule = appContainer.resolve(
                        Modules.PRICING
                    ) as any
                    const spy = jest.spyOn(pricingModule, "calculatePrices")
                    spy.mockClear()

                    const response = await api.get(
                        `/store/offers?id[]=${seedA.offer.id}&id[]=${seedB.offer.id}&fields=+calculated_price&region_id=${region.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offers).toHaveLength(2)
                    // Event-driven search reindex may also call calculatePrices
                    // in the background (one price set per product), so scope the
                    // assertion to the endpoint's batched call, which is the only
                    // one spanning both offers' price sets.
                    const batchedCalls = spy.mock.calls.filter(
                        ([selector]) =>
                            Array.isArray(
                                (selector as { id?: string[] })?.id
                            ) && (selector as { id: string[] }).id.length > 1
                    )
                    expect(batchedCalls).toHaveLength(1)
                    const arg = batchedCalls[0][0] as { id: string[] }
                    expect(arg.id).toHaveLength(2)

                    const byId = new Map<string, any>(
                        response.data.offers.map((o: any) => [o.id, o])
                    )
                    expect(
                        byId.get(seedA.offer.id).calculated_price
                            .calculated_amount
                    ).toEqual(1000)
                    expect(
                        byId.get(seedB.offer.id).calculated_price
                            .calculated_amount
                    ).toEqual(2000)

                    spy.mockRestore()
                })

                it("excludes offers from sellers that are not open", async () => {
                    const seed = await seedSellerOffer({
                        email: "pending@test.com",
                        name: "Pending",
                        stocked: 10,
                        offerPrice: 1000,
                        approve: false,
                    })

                    const response = await api.get(
                        `/store/offers?product_id=${seed.productId}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offers).toHaveLength(0)
                })

                it("excludes offers on unpublished products", async () => {
                    const seed = await seedSellerOffer({
                        email: "draft@test.com",
                        name: "Draft",
                        stocked: 10,
                        offerPrice: 1000,
                        published: false,
                    })

                    const response = await api.get(
                        `/store/offers?product_id=${seed.productId}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offers).toHaveLength(0)
                })

                it("computes inventory_quantity as floor(stocked / required_quantity)", async () => {
                    const seed = await seedSellerOffer({
                        email: "bundle@test.com",
                        name: "Bundle",
                        stocked: 7,
                        offerPrice: 9000,
                        required_quantity: 3,
                    })

                    const response = await api.get(
                        `/store/offers?product_id=${seed.productId}&fields=+inventory_quantity`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offers).toHaveLength(1)
                    expect(response.data.offers[0].inventory_quantity).toEqual(2)
                    expect(response.data.offers[0].in_stock).toEqual(true)
                })

                it("reports zero stock for an offer whose location is not linked to the sales channel", async () => {
                    const seed = await seedSellerOffer({
                        email: "wronglocation@test.com",
                        name: "Wrong",
                        stocked: 10,
                        offerPrice: 1234,
                        linkLocationToChannel: false,
                    })

                    const response = await api.get(
                        `/store/offers?product_id=${seed.productId}&fields=+inventory_quantity`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offers).toHaveLength(1)
                    expect(response.data.offers[0].inventory_quantity).toEqual(0)
                    expect(response.data.offers[0].in_stock).toEqual(false)
                })
            })

            describe("GET /store/offers/:id", () => {
                it("returns a single open seller's offer", async () => {
                    const seed = await seedSellerOffer({
                        email: "single@test.com",
                        name: "Single",
                        stocked: 4,
                        offerPrice: 3300,
                    })

                    const response = await api.get(
                        `/store/offers/${seed.offer.id}?fields=+calculated_price&region_id=${region.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offer.id).toEqual(seed.offer.id)
                    expect(response.data.offer.product_id).toEqual(seed.productId)
                    expect(
                        response.data.offer.calculated_price.calculated_amount
                    ).toEqual(3300)
                })

                it("404s for an offer whose seller is not open", async () => {
                    const seed = await seedSellerOffer({
                        email: "hidden@test.com",
                        name: "Hidden",
                        stocked: 4,
                        offerPrice: 3300,
                        approve: false,
                    })

                    const error = await api
                        .get(`/store/offers/${seed.offer.id}`, storeHeaders)
                        .catch((e) => e)

                    expect(error.response.status).toEqual(404)
                })
            })
        })
    },
})
