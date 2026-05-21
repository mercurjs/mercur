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
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

const approveSeller = async (
    container: MedusaContainer,
    sellerId: string,
) => {
    const sellerModule: any = container.resolve(MercurModules.SELLER)
    await sellerModule.updateSellers({
        id: sellerId,
        status: SellerStatus.OPEN,
    })
}

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Store - Products with Offers", () => {
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
                offerSku?: string
                required_quantity?: number
                productId?: string
                variantId?: string
                stockLocationId?: string
                linkLocationToChannel?: boolean
            }) => {
                const tag = `s${++seedCounter}${Date.now()}`
                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                await approveSeller(appContainer, (result.seller as any).id)
                const headers = result.headers

                let stockLocationId = opts.stockLocationId
                if (!stockLocationId) {
                    const stockLocation = (
                        await api.post(
                            `/vendor/stock-locations`,
                            { name: `${opts.name} WH ${tag}` },
                            headers
                        )
                    ).data.stock_location
                    stockLocationId = stockLocation.id

                    if (opts.linkLocationToChannel !== false) {
                        await api.post(
                            `/vendor/stock-locations/${stockLocationId}/sales-channels`,
                            { add: [salesChannel.id] },
                            headers
                        )
                    }
                }

                const inventoryItem = (
                    await api.post(
                        `/vendor/inventory-items`,
                        { title: `${opts.name} Inv ${tag}` },
                        headers
                    )
                ).data.inventory_item

                await api.post(
                    `/vendor/inventory-items/${inventoryItem.id}/location-levels`,
                    {
                        location_id: stockLocationId,
                        stocked_quantity: opts.stocked,
                    },
                    headers
                )

                let productId = opts.productId
                let variantId = opts.variantId
                if (!productId || !variantId) {
                    const product = (
                        await api.post(
                            `/vendor/products`,
                            {
                                status: "published",
                                title: `${opts.name} Product ${tag}`,
                                variant_attributes: [
                                    {
                                        name: `Default ${tag}`,
                                        type: "multi_select",
                                        values: ["Default"],
                                        is_variant_axis: true,
                                    },
                                ],
                                variants: [
                                    {
                                        title: "Default",
                                        sku: `${opts.email}-V-SKU-${tag}`,
                                        attribute_values: {
                                            [`Default ${tag}`]: "Default",
                                        },
                                    },
                                ],
                            },
                            headers
                        )
                    ).data.product

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
                            sku:
                                opts.offerSku ??
                                `${opts.name.replace(/\s/g, "")}-OFFER-${tag}`,
                            variant_id: variantId,
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
                    productId: productId as string,
                    variantId: variantId as string,
                    inventoryItemId: inventoryItem.id,
                    stockLocationId: stockLocationId as string,
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

                const link = appContainer.resolve(
                    ContainerRegistrationKeys.LINK
                )
                await link.create({
                    [Modules.API_KEY]: { publishable_key_id: apiKey.id },
                    [Modules.SALES_CHANNEL]: {
                        sales_channel_id: salesChannel.id,
                    },
                })
            })

            describe("GET /store/products/:id", () => {
                it("populates variant.offers[] with calculated_price when requested", async () => {
                    const seed = await seedSellerOffer({
                        email: "happy@test.com",
                        name: "Happy",
                        stocked: 10,
                        offerPrice: 2500,
                    })

                    const response = await api.get(
                        `/store/products/${seed.productId}?fields=*variants,variants.offers.calculated_price&region_id=${region.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    const variant = response.data.product.variants.find(
                        (v: any) => v.id === seed.variantId
                    )
                    expect(variant.offers).toHaveLength(1)
                    expect(variant.offers[0]).toEqual(
                        expect.objectContaining({
                            id: seed.offer.id,
                            price_set_id: expect.any(String),
                            sku: expect.any(String),
                        })
                    )
                    expect(
                        variant.offers[0].calculated_price.calculated_amount
                    ).toEqual(2500)
                    expect(
                        variant.offers[0].calculated_price.currency_code
                    ).toEqual("usd")
                })

                it("returns sibling offers from two sellers on one variant sorted by price ASC", async () => {
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
                        `/store/products/${seedA.productId}?fields=*variants,variants.offers.calculated_price&region_id=${region.id}`,
                        storeHeaders
                    )

                    const variant = response.data.product.variants.find(
                        (v: any) => v.id === seedA.variantId
                    )
                    expect(variant.offers).toHaveLength(2)
                    expect(variant.offers[0].id).toEqual(seedB.offer.id)
                    expect(variant.offers[1].id).toEqual(seedA.offer.id)
                    expect(
                        variant.offers.map(
                            (o: any) => o.calculated_price.calculated_amount
                        )
                    ).toEqual([2000, 5000])
                })

                it("filters offers whose effective stocked quantity is zero", async () => {
                    const inStock = await seedSellerOffer({
                        email: "instock@test.com",
                        name: "InStock",
                        stocked: 5,
                        offerPrice: 1500,
                    })
                    await seedSellerOffer({
                        email: "oos@test.com",
                        name: "Oos",
                        stocked: 0,
                        offerPrice: 1000,
                        productId: inStock.productId,
                        variantId: inStock.variantId,
                    })

                    const response = await api.get(
                        `/store/products/${inStock.productId}?fields=*variants,variants.offers.calculated_price,variants.offers.inventory_quantity&region_id=${region.id}`,
                        storeHeaders
                    )

                    const variant = response.data.product.variants.find(
                        (v: any) => v.id === inStock.variantId
                    )
                    expect(variant.offers).toHaveLength(1)
                    expect(variant.offers[0].id).toEqual(inStock.offer.id)
                    expect(variant.offers[0].inventory_quantity).toEqual(5)
                    expect(variant.offers[0].in_stock).toEqual(true)
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
                        `/store/products/${seed.productId}?fields=*variants,variants.offers.inventory_quantity&region_id=${region.id}`,
                        storeHeaders
                    )

                    const variant = response.data.product.variants.find(
                        (v: any) => v.id === seed.variantId
                    )
                    expect(variant.offers).toHaveLength(1)
                    expect(variant.offers[0].inventory_quantity).toEqual(2)
                })

                it("hides offers whose stock location is not linked to the publishable key's sales channel", async () => {
                    const seed = await seedSellerOffer({
                        email: "wronglocation@test.com",
                        name: "Wrong",
                        stocked: 10,
                        offerPrice: 1234,
                        linkLocationToChannel: false,
                    })

                    const response = await api.get(
                        `/store/products/${seed.productId}?fields=*variants,variants.offers.inventory_quantity&region_id=${region.id}`,
                        storeHeaders
                    )

                    const variant = response.data.product.variants.find(
                        (v: any) => v.id === seed.variantId
                    )
                    expect(variant.offers ?? []).toHaveLength(0)
                })
            })

            describe("GET /store/products", () => {
                it("populates variant.offers[] across the product list when requested", async () => {
                    const seedA = await seedSellerOffer({
                        email: "list-a@test.com",
                        name: "ListA",
                        stocked: 10,
                        offerPrice: 1000,
                    })
                    const seedB = await seedSellerOffer({
                        email: "list-b@test.com",
                        name: "ListB",
                        stocked: 10,
                        offerPrice: 2000,
                    })

                    const response = await api.get(
                        `/store/products?fields=*variants,variants.offers.calculated_price,variants.offers.inventory_quantity&region_id=${region.id}&id[]=${seedA.productId}&id[]=${seedB.productId}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    const productMap = new Map<string, any>(
                        response.data.products.map((p: any) => [p.id, p])
                    )
                    const variantA = productMap
                        .get(seedA.productId)
                        ?.variants.find((v: any) => v.id === seedA.variantId)
                    const variantB = productMap
                        .get(seedB.productId)
                        ?.variants.find((v: any) => v.id === seedB.variantId)

                    expect(variantA.offers).toHaveLength(1)
                    expect(
                        variantA.offers[0].calculated_price.calculated_amount
                    ).toEqual(1000)
                    expect(variantA.offers[0].inventory_quantity).toEqual(10)

                    expect(variantB.offers).toHaveLength(1)
                    expect(
                        variantB.offers[0].calculated_price.calculated_amount
                    ).toEqual(2000)
                })

                it("skips offer wrapping when calculated_price / inventory_quantity are not in fields", async () => {
                    const seed = await seedSellerOffer({
                        email: "no-offers@test.com",
                        name: "NoOffers",
                        stocked: 10,
                        offerPrice: 4321,
                    })

                    const response = await api.get(
                        `/store/products/${seed.productId}?fields=id,title,variants.id,variants.title`,
                        storeHeaders
                    )

                    const variant = response.data.product.variants.find(
                        (v: any) => v.id === seed.variantId
                    )
                    expect(variant.offers).toBeUndefined()
                })
            })

            describe("PriceSet invariants — single calculatePrices round-trip", () => {
                it("resolves prices for M offers across variants in one calculatePrices call", async () => {
                    // Seed three offers on three different products so the
                    // route walks multiple variants. The util collects all
                    // their price_set_ids and issues a single bulk pricing
                    // call.
                    const seedA = await seedSellerOffer({
                        email: "bulk-a@test.com",
                        name: "BulkA",
                        stocked: 10,
                        offerPrice: 1000,
                    })
                    const seedB = await seedSellerOffer({
                        email: "bulk-b@test.com",
                        name: "BulkB",
                        stocked: 10,
                        offerPrice: 2000,
                    })
                    const seedC = await seedSellerOffer({
                        email: "bulk-c@test.com",
                        name: "BulkC",
                        stocked: 10,
                        offerPrice: 3000,
                    })

                    const pricingModule = appContainer.resolve(
                        Modules.PRICING
                    ) as any
                    const spy = jest.spyOn(pricingModule, "calculatePrices")
                    spy.mockClear()

                    const response = await api.get(
                        `/store/products?fields=*variants,variants.offers.calculated_price&region_id=${region.id}&id[]=${seedA.productId}&id[]=${seedB.productId}&id[]=${seedC.productId}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.products).toHaveLength(3)
                    expect(spy).toHaveBeenCalledTimes(1)
                    const arg = spy.mock.calls[0][0] as { id: string[] }
                    expect(arg.id).toHaveLength(3)

                    spy.mockRestore()
                })
            })
        })
    },
})
