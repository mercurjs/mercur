import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
    ContainerRegistrationKeys,
    Modules,
} from "@medusajs/framework/utils"
import {
    createOffersWorkflow,
    updateOffersWorkflow,
} from "@mercurjs/core/workflows"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("updateOffersWorkflow - dangling offer price links", () => {
            let appContainer: MedusaContainer

            beforeAll(() => {
                appContainer = getContainer()
            })

            const seedOffer = async (
                tag: string,
                prices: Array<{ amount: number; currency_code: string }>
            ) => {
                const { seller, member, headers } = await createSellerUser(
                    appContainer,
                    { email: `dangling-${tag}@test.com`, name: `Seller ${tag}` }
                )

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `WH ${tag}` },
                        headers
                    )
                ).data.stock_location

                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: `Profile ${tag}`, type: "default" },
                        headers
                    )
                ).data.shipping_profile

                const product = await createVendorProduct(api, headers, {
                    title: `Dangling Product ${tag}`,
                    variants: [{ title: `V ${tag}` }],
                })

                const { result } = await createOffersWorkflow(
                    appContainer
                ).run({
                    input: {
                        offers: [
                            {
                                seller_id: seller.id,
                                created_by: member.id,
                                variant_id: product.variants[0].id,
                                shipping_profile_id: shippingProfile.id,
                                sku: `SKU-${tag}`,
                                inventory_items: [
                                    {
                                        sku: `SKU-${tag}`,
                                        stock_levels: [
                                            {
                                                location_id: stockLocation.id,
                                                stocked_quantity: 100,
                                            },
                                        ],
                                    },
                                ],
                                prices,
                            },
                        ],
                    },
                })

                return result[0]
            }

            const listPrices = async (offerId: string) => {
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data } = await query.graph({
                    entity: "offer",
                    fields: ["id", "prices.id", "prices.amount"],
                    filters: { id: offerId },
                })

                return ((data[0]?.prices ?? []) as Array<{
                    id: string
                    amount: number
                } | null>).filter(
                    (p): p is { id: string; amount: number } => !!p?.id
                )
            }

            // The offer↔price link survives a price row that no longer
            // resolves, and `query.graph` then yields a null element. The
            // dangling link must not break the price diff.
            const danglePrice = async (priceId: string) => {
                const pricing = appContainer.resolve(Modules.PRICING)
                await pricing.softDeletePrices([priceId])
            }

            it("updates an offer that holds one resolvable price and one dangling link", async () => {
                const tag = `a${Date.now()}`
                const offer = await seedOffer(tag, [
                    { amount: 1000, currency_code: "usd" },
                    { amount: 2000, currency_code: "eur" },
                ])

                const prices = await listPrices(offer.id)
                expect(prices).toHaveLength(2)

                const kept = prices.find((p) => p.amount === 1000)!
                const dangling = prices.find((p) => p.amount === 2000)!
                await danglePrice(dangling.id)

                await updateOffersWorkflow(appContainer).run({
                    input: {
                        offers: [
                            {
                                id: offer.id,
                                prices: [
                                    {
                                        id: kept.id,
                                        amount: 1500,
                                        currency_code: "usd",
                                    },
                                ],
                            },
                        ],
                    },
                })

                const after = await listPrices(offer.id)
                expect(after).toHaveLength(1)
                expect(after[0]).toEqual(
                    expect.objectContaining({ id: kept.id, amount: 1500 })
                )
            })

            it("accepts a fresh price on an offer whose only price link is dangling", async () => {
                const tag = `b${Date.now()}`
                const offer = await seedOffer(tag, [
                    { amount: 1000, currency_code: "usd" },
                ])

                const [only] = await listPrices(offer.id)
                await danglePrice(only.id)
                expect(await listPrices(offer.id)).toHaveLength(0)

                await updateOffersWorkflow(appContainer).run({
                    input: {
                        offers: [
                            {
                                id: offer.id,
                                prices: [
                                    { amount: 3000, currency_code: "usd" },
                                ],
                            },
                        ],
                    },
                })

                const after = await listPrices(offer.id)
                expect(after).toHaveLength(1)
                expect(after[0].amount).toEqual(3000)
            })

            it("still replaces prices for an offer with no dangling links", async () => {
                const tag = `c${Date.now()}`
                const offer = await seedOffer(tag, [
                    { amount: 1000, currency_code: "usd" },
                    { amount: 2000, currency_code: "eur" },
                ])

                const prices = await listPrices(offer.id)
                const kept = prices.find((p) => p.amount === 1000)!

                await updateOffersWorkflow(appContainer).run({
                    input: {
                        offers: [
                            {
                                id: offer.id,
                                prices: [
                                    {
                                        id: kept.id,
                                        amount: 1100,
                                        currency_code: "usd",
                                    },
                                    { amount: 900, currency_code: "gbp" },
                                ],
                            },
                        ],
                    },
                })

                const after = await listPrices(offer.id)
                expect(after).toHaveLength(2)
                expect(
                    after.map((p) => p.amount).sort((a, b) => a - b)
                ).toEqual([900, 1100])
            })
        })
    },
})
