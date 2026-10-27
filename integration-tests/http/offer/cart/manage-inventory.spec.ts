import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Store - Cart offer inventory modes", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let region: any
            let salesChannel: any

            let seedCounter = 0
            const seedSellerOffer = async (opts: {
                email: string
                name: string
                offerPrice: number
                manage_inventory?: boolean
                allow_backorder?: boolean
                inventory_items: Array<{
                    stocked: number
                    required_quantity?: number
                }>
            }) => {
                const tag = `s${++seedCounter}${Date.now()}`
                const { headers, seller } = await createSellerUser(
                    appContainer,
                    { email: opts.email, name: opts.name }
                )

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

                const product = await createVendorProduct(api, headers, {
                    title: `${opts.name} Product ${tag}`,
                    sku: `${opts.email}-V-SKU-${tag}`,
                })

                await api.post(
                    `/vendor/sales-channels/${salesChannel.id}/products`,
                    { add: [product.id] },
                    headers
                )

                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `${opts.name} Profile`,
                })

                const offer = (
                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: `${opts.name.replace(/\s/g, "")}-OFFER-${tag}`,
                            variant_id: product.variants[0].id,
                            shipping_profile_id: shippingProfile.id,
                            manage_inventory: opts.manage_inventory,
                            allow_backorder: opts.allow_backorder,
                            inventory_items: opts.inventory_items.map(
                                (item, i) => ({
                                    title: `${opts.name} Inv ${i} ${tag}`,
                                    required_quantity:
                                        item.required_quantity ?? 1,
                                    stock_levels: [
                                        {
                                            location_id: stockLocation.id,
                                            stocked_quantity: item.stocked,
                                        },
                                    ],
                                })
                            ),
                            prices: [
                                { amount: opts.offerPrice, currency_code: "usd" },
                            ],
                        },
                        headers
                    )
                ).data.offer

                return {
                    headers,
                    sellerId: seller.id,
                    offer,
                    product,
                    shippingProfile,
                    stockLocation,
                }
            }

            const seedSharedItemOffers = async (name: string) => {
                const base = await seedSellerOffer({
                    email: `${name.toLowerCase()}@test.com`,
                    name,
                    offerPrice: 100,
                    inventory_items: [{ stocked: 100, required_quantity: 1 }],
                })
                const sharedItemId = base.offer.inventory_items[0].id

                const pack = (
                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: `${name}-PACK-${Date.now()}`,
                            variant_id: base.product.variants[0].id,
                            shipping_profile_id: base.shippingProfile.id,
                            inventory_items: [
                                {
                                    title: `${name} pack placeholder`,
                                    required_quantity: 1,
                                    stock_levels: [
                                        {
                                            location_id: base.stockLocation.id,
                                            stocked_quantity: 0,
                                        },
                                    ],
                                },
                            ],
                            prices: [{ amount: 1200, currency_code: "usd" }],
                        },
                        base.headers
                    )
                ).data.offer

                await api.post(
                    `/vendor/offers/${pack.id}/inventory-items/batch`,
                    {
                        create: [
                            { inventory_item_id: sharedItemId, required_quantity: 12 },
                        ],
                        delete: [pack.inventory_items[0].id],
                    },
                    base.headers
                )

                return { unit: base.offer, pack }
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

            const addLine = (cartId: string, offer_id: string, quantity: number) =>
                api
                    .post(
                        `/store/carts/${cartId}/line-items`,
                        { offer_id, quantity },
                        storeHeaders
                    )
                    .catch((e) => e.response)

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
            })

            it("unmanaged offer is always purchasable past stock", async () => {
                const { offer } = await seedSellerOffer({
                    email: "unmanaged@test.com",
                    name: "Unmanaged",
                    offerPrice: 2500,
                    manage_inventory: false,
                    inventory_items: [{ stocked: 1 }],
                })

                const cart = await createCart()
                const res = await addLine(cart.id, offer.id, 100)

                expect(res.status).toEqual(200)
                expect(res.data.cart.items[0].quantity).toEqual(100)
            })

            it("managed offer without backorders blocks over-stock adds", async () => {
                const { offer } = await seedSellerOffer({
                    email: "managed@test.com",
                    name: "Managed",
                    offerPrice: 2500,
                    inventory_items: [{ stocked: 3 }],
                })

                const cart = await createCart()
                const res = await addLine(cart.id, offer.id, 10)

                expect(res.status).toBeGreaterThanOrEqual(400)
                expect(res.status).toBeLessThan(500)
                expect(JSON.stringify(res.data)).toMatch(
                    /INSUFFICIENT_INVENTORY|stock/i
                )
            })

            it("backorder offer is purchasable past stock", async () => {
                const { offer } = await seedSellerOffer({
                    email: "backorder@test.com",
                    name: "Backorder",
                    offerPrice: 2500,
                    manage_inventory: true,
                    allow_backorder: true,
                    inventory_items: [{ stocked: 1 }],
                })

                const cart = await createCart()
                const res = await addLine(cart.id, offer.id, 100)

                expect(res.status).toEqual(200)
                expect(res.data.cart.items[0].quantity).toEqual(100)
            })

            it("kit is all-or-nothing: a short component blocks the sale", async () => {
                const { offer } = await seedSellerOffer({
                    email: "kit-short@test.com",
                    name: "KitShort",
                    offerPrice: 5000,
                    inventory_items: [
                        { stocked: 100, required_quantity: 1 },
                        { stocked: 1, required_quantity: 1 },
                    ],
                })

                const cart = await createCart()
                const res = await addLine(cart.id, offer.id, 2)

                expect(res.status).toBeGreaterThanOrEqual(400)
                expect(res.status).toBeLessThan(500)
            })

            it("kit with every component covered adds successfully", async () => {
                const { offer } = await seedSellerOffer({
                    email: "kit-ok@test.com",
                    name: "KitOk",
                    offerPrice: 5000,
                    inventory_items: [
                        { stocked: 100, required_quantity: 1 },
                        { stocked: 100, required_quantity: 2 },
                    ],
                })

                const cart = await createCart()
                const res = await addLine(cart.id, offer.id, 2)

                expect(res.status).toEqual(200)
                expect(res.data.cart.items[0].quantity).toEqual(2)
            })

            it("backorder lets a short kit through", async () => {
                const { offer } = await seedSellerOffer({
                    email: "kit-backorder@test.com",
                    name: "KitBackorder",
                    offerPrice: 5000,
                    allow_backorder: true,
                    inventory_items: [
                        { stocked: 100, required_quantity: 1 },
                        { stocked: 1, required_quantity: 1 },
                    ],
                })

                const cart = await createCart()
                const res = await addLine(cart.id, offer.id, 2)

                expect(res.status).toEqual(200)
            })

            it("rejects an add that pushes the merged line past stock", async () => {
                const { offer } = await seedSellerOffer({
                    email: "merged@test.com",
                    name: "Merged",
                    offerPrice: 1200,
                    inventory_items: [{ stocked: 100, required_quantity: 12 }],
                })

                const cart = await createCart()
                const first = await addLine(cart.id, offer.id, 2)
                expect(first.status).toEqual(200)

                const second = await addLine(cart.id, offer.id, 7)
                expect(second.status).toBeGreaterThanOrEqual(400)
                expect(second.status).toBeLessThan(500)

                const fits = await addLine(cart.id, offer.id, 6)
                expect(fits.status).toEqual(200)
                expect(fits.data.cart.items[0].quantity).toEqual(8)
            })

            it("counts other offers drawing on the same inventory item when adding", async () => {
                const { unit, pack } = await seedSharedItemOffers("SharedAdd")

                const cart = await createCart()
                expect((await addLine(cart.id, unit.id, 90)).status).toEqual(200)

                const res = await addLine(cart.id, pack.id, 1)
                expect(res.status).toBeGreaterThanOrEqual(400)
                expect(res.status).toBeLessThan(500)
            })

            it("sums items sharing an inventory item within a single add", async () => {
                const { unit, pack } = await seedSharedItemOffers("SharedBatch")

                const cart = await createCart()
                const { errors } = await addToCartWorkflow(appContainer).run({
                    input: {
                        cart_id: cart.id,
                        items: [
                            {
                                variant_id: unit.variant_id,
                                quantity: 60,
                                offer_id: unit.id,
                                metadata: { offer_id: unit.id },
                            },
                            {
                                variant_id: pack.variant_id,
                                quantity: 4,
                                offer_id: pack.id,
                                metadata: { offer_id: pack.id },
                            },
                        ],
                    },
                    throwOnError: false,
                })

                expect(errors.length).toBeGreaterThan(0)
            })

            it("counts other offers drawing on the same inventory item when updating", async () => {
                const { unit, pack } = await seedSharedItemOffers("SharedUpdate")

                const cart = await createCart()
                expect((await addLine(cart.id, unit.id, 80)).status).toEqual(200)
                const added = await addLine(cart.id, pack.id, 1)
                expect(added.status).toEqual(200)

                const packLine = added.data.cart.items.find(
                    (i: { metadata?: { offer_id?: string } }) =>
                        i.metadata?.offer_id === pack.id
                )
                const res = await api
                    .post(
                        `/store/carts/${cart.id}/line-items/${packLine.id}`,
                        { quantity: 2 },
                        storeHeaders
                    )
                    .catch((e) => e.response)

                expect(res.status).toBeGreaterThanOrEqual(400)
                expect(res.status).toBeLessThan(500)
            })

            it("persists and returns the offer inventory flags", async () => {
                const { offer, headers } = await seedSellerOffer({
                    email: "flags@test.com",
                    name: "Flags",
                    offerPrice: 2500,
                    manage_inventory: false,
                    allow_backorder: true,
                    inventory_items: [{ stocked: 5 }],
                })

                expect(offer.manage_inventory).toEqual(false)
                expect(offer.allow_backorder).toEqual(true)

                const updated = (
                    await api.post(
                        `/vendor/offers/${offer.id}`,
                        { manage_inventory: true, allow_backorder: false },
                        headers
                    )
                ).data.offer

                expect(updated.manage_inventory).toEqual(true)
                expect(updated.allow_backorder).toEqual(false)
            })
        })
    },
})
