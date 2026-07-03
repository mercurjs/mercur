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
import {
    createVendorProduct,
    assignProductsToSeller,
} from "../../../helpers/create-product"
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
        describe("Store - Products cheapest offer price", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let region: any
            let salesChannel: any

            let seedCounter = 0
            const seedSellerOffer = async (opts: {
                email: string
                name: string
                offerPrice: number
                productId?: string
                variantId?: string
            }) => {
                const tag = `s${++seedCounter}${Date.now()}`
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                await approveSeller(appContainer, (result.seller as any).id)
                const headers = result.headers

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `${opts.name} WH ${tag}` },
                        headers
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    headers
                )

                let productId = opts.productId
                let variantId = opts.variantId
                if (!productId || !variantId) {
                    const product = await createVendorProduct(api, headers, {
                        title: `${opts.name} Product ${tag}`,
                        sku: `${opts.email}-V-SKU-${tag}`,
                    })

                    await api.post(
                        `/vendor/sales-channels/${salesChannel.id}/products`,
                        { add: [product.id] },
                        headers
                    )

                    await assignProductsToSeller(
                        appContainer,
                        result.seller.id as string,
                        [product.id]
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
                                    required_quantity: 1,
                                    stock_levels: [
                                        {
                                            location_id: stockLocation.id,
                                            stocked_quantity: 10,
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

            describe("GET /store/products", () => {
                it("returns the cheapest offer_id and its calculated_price per variant", async () => {
                    const expensive = await seedSellerOffer({
                        email: "expensive-prod@test.com",
                        name: "Expensive",
                        offerPrice: 5000,
                    })
                    const cheap = await seedSellerOffer({
                        email: "cheap-prod@test.com",
                        name: "Cheap",
                        offerPrice: 2000,
                        productId: expensive.productId,
                        variantId: expensive.variantId,
                    })

                    const response = await api.get(
                        `/store/products?id[]=${expensive.productId}&region_id=${region.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.products).toHaveLength(1)
                    const variant = response.data.products[0].variants[0]
                    expect(variant.offer_id).toEqual(cheap.offer.id)
                    expect(variant.calculated_price.calculated_amount).toEqual(
                        2000
                    )
                    expect(variant.calculated_price.currency_code).toEqual("usd")
                })

                it("does not compute prices without region_id or an explicit field", async () => {
                    const seed = await seedSellerOffer({
                        email: "nogate-prod@test.com",
                        name: "NoGate",
                        offerPrice: 1500,
                    })

                    const response = await api.get(
                        `/store/products?id[]=${seed.productId}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    const variant = response.data.products[0].variants[0]
                    expect(variant.offer_id).toBeUndefined()
                    expect(variant.calculated_price).toBeUndefined()
                })

                it("prices variants from different products in a single calculatePrices call", async () => {
                    const seedA = await seedSellerOffer({
                        email: "batch-prod-a@test.com",
                        name: "BatchA",
                        offerPrice: 1000,
                    })
                    const seedB = await seedSellerOffer({
                        email: "batch-prod-b@test.com",
                        name: "BatchB",
                        offerPrice: 2000,
                    })

                    const pricingModule = appContainer.resolve(
                        Modules.PRICING
                    ) as any
                    const spy = jest.spyOn(pricingModule, "calculatePrices")
                    spy.mockClear()

                    const response = await api.get(
                        `/store/products?id[]=${seedA.productId}&id[]=${seedB.productId}&region_id=${region.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.products).toHaveLength(2)
                    // Event-driven search reindex may also call calculatePrices
                    // in the background (one price set per product), so scope the
                    // assertion to the endpoint's batched call, which is the only
                    // one spanning both products' price sets.
                    const batchedCalls = spy.mock.calls.filter(
                        ([selector]) =>
                            Array.isArray(
                                (selector as { id?: string[] })?.id
                            ) && (selector as { id: string[] }).id.length > 1
                    )
                    expect(batchedCalls).toHaveLength(1)

                    const byProduct = new Map<string, any>(
                        response.data.products.map((p: any) => [p.id, p])
                    )
                    expect(
                        byProduct.get(seedA.productId).variants[0].offer_id
                    ).toEqual(seedA.offer.id)
                    expect(
                        byProduct.get(seedB.productId).variants[0].offer_id
                    ).toEqual(seedB.offer.id)

                    spy.mockRestore()
                })
            })

            describe("GET /store/products/:id", () => {
                it("returns the cheapest offer_id and calculated_price on the detail route", async () => {
                    const expensive = await seedSellerOffer({
                        email: "detail-expensive@test.com",
                        name: "DetailExpensive",
                        offerPrice: 4000,
                    })
                    const cheap = await seedSellerOffer({
                        email: "detail-cheap@test.com",
                        name: "DetailCheap",
                        offerPrice: 1500,
                        productId: expensive.productId,
                        variantId: expensive.variantId,
                    })

                    const response = await api.get(
                        `/store/products/${expensive.productId}?region_id=${region.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    const variant = response.data.product.variants[0]
                    expect(variant.offer_id).toEqual(cheap.offer.id)
                    expect(variant.calculated_price.calculated_amount).toEqual(
                        1500
                    )
                })
            })
        })
    },
})
