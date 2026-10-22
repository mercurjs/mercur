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
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
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
        describe("Store - Offer lead time", () => {
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

                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `${opts.name} Profile ${tag}`,
                })

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

            const setMarketplaceDefault = async (days: number | null) => {
                const storeModule: any = appContainer.resolve(Modules.STORE)
                const [store] = await storeModule.listStores({}, { take: 1 })
                await storeModule.updateStores(store.id, {
                    metadata: { ...(store.metadata ?? {}), default_leadtime_to_ship: days },
                })
            }

            const effectiveLeadtime = async (productId: string) => {
                const { data } = await api.get(`/store/offers?product_id=${productId}`, storeHeaders)
                return data.offers[0].effective_leadtime_to_ship
            }

            describe("effective_leadtime_to_ship", () => {
                it("falls back from the offer to the seller default to the marketplace default", async () => {
                    await setMarketplaceDefault(5)
                    const seed = await seedSellerOffer({
                        email: "leadtime@test.com",
                        name: "Leadtime",
                        stocked: 10,
                        offerPrice: 1000,
                    })

                    const { data: me } = await api.get(`/vendor/sellers/me`, seed.headers)
                    expect(me.seller.default_leadtime_to_ship).toBeNull()
                    expect(await effectiveLeadtime(seed.productId)).toEqual(5)

                    await api.post(`/vendor/sellers/me`, { default_leadtime_to_ship: 3 }, seed.headers)
                    expect(await effectiveLeadtime(seed.productId)).toEqual(3)

                    await api.post(`/vendor/offers/${seed.offer.id}`, { leadtime_to_ship: 1 }, seed.headers)
                    const { data } = await api.get(`/store/offers?product_id=${seed.productId}`, storeHeaders)
                    expect(data.offers[0].leadtime_to_ship).toEqual(1)
                    expect(data.offers[0].effective_leadtime_to_ship).toEqual(1)

                    await api.post(`/vendor/offers/${seed.offer.id}`, { leadtime_to_ship: null }, seed.headers)
                    await api.post(`/vendor/sellers/me`, { default_leadtime_to_ship: null }, seed.headers)
                    expect(await effectiveLeadtime(seed.productId)).toEqual(5)
                })

                it("is null when nothing sets a lead time, and is returned on the detail route", async () => {
                    await setMarketplaceDefault(null)
                    const seed = await seedSellerOffer({
                        email: "noleadtime@test.com",
                        name: "NoLeadtime",
                        stocked: 10,
                        offerPrice: 1000,
                    })

                    expect(await effectiveLeadtime(seed.productId)).toBeNull()

                    await api.post(`/vendor/sellers/me`, { default_leadtime_to_ship: 4 }, seed.headers)
                    const { data } = await api.get(`/store/offers/${seed.offer.id}`, storeHeaders)
                    expect(data.offer.effective_leadtime_to_ship).toEqual(4)
                })

                it("rejects a negative seller default", async () => {
                    const seed = await seedSellerOffer({
                        email: "negative@test.com",
                        name: "Negative",
                        stocked: 1,
                        offerPrice: 1000,
                    })
                    const res = await api
                        .post(`/vendor/sellers/me`, { default_leadtime_to_ship: -1 }, seed.headers)
                        .catch((e: any) => e.response)
                    expect(res.status).toEqual(400)
                })
            })
        })
    },
})
