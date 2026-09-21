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
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
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

                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `Profile ${tag}`,
                })

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

            const seedOfferForVariant = async (
                tag: string,
                variantId: string,
                prices: Array<{ amount: number; currency_code: string }>
            ) => {
                const { seller, member, headers } = await createSellerUser(
                    appContainer,
                    { email: `shared-${tag}@test.com`, name: `Seller ${tag}` }
                )

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `WH ${tag}` },
                        headers
                    )
                ).data.stock_location

                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `Profile ${tag}`,
                })

                const { result } = await createOffersWorkflow(
                    appContainer
                ).run({
                    input: {
                        offers: [
                            {
                                seller_id: seller.id,
                                created_by: member.id,
                                variant_id: variantId,
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

            it("preserves another seller's prices on the same variant when seller 1 updates their offer prices", async () => {
                const tag = `shared${Date.now()}`
                const offer1 = await seedOffer(`${tag}-1`, [
                    { amount: 1000, currency_code: "usd" },
                ])

                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data } = await query.graph({
                    entity: "offer",
                    fields: ["variant_id"],
                    filters: { id: offer1.id },
                })
                const variantId = data[0].variant_id

                const offer2 = await seedOfferForVariant(
                    `${tag}-2`,
                    variantId,
                    [
                        { amount: 2000, currency_code: "usd" },
                        { amount: 1800, currency_code: "eur" },
                    ]
                )

                // Verify both offers have their prices initially
                const prices1Before = await listPrices(offer1.id)
                const prices2Before = await listPrices(offer2.id)
                expect(prices1Before).toHaveLength(1)
                expect(prices1Before[0].amount).toBe(1000)
                expect(prices2Before).toHaveLength(2)

                // Seller 1 updates their offer price
                await updateOffersWorkflow(appContainer).run({
                    input: {
                        offers: [
                            {
                                id: offer1.id,
                                prices: [
                                    {
                                        amount: 1500,
                                        currency_code: "usd",
                                    },
                                ],
                            },
                        ],
                    },
                })

                // Verify Seller 1's price is updated
                const prices1After = await listPrices(offer1.id)
                expect(prices1After).toHaveLength(1)
                expect(prices1After[0].amount).toBe(1500)

                // CRITICAL: Verify Seller 2's prices on the same variant were NOT wiped
                const prices2After = await listPrices(offer2.id)
                expect(prices2After).toHaveLength(2)
                expect(
                    prices2After.map((p) => p.amount).sort((a, b) => a - b)
                ).toEqual([1800, 2000])
            })
        })
    },
})
