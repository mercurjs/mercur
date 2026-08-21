import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createOffersWorkflow } from "@mercurjs/core/workflows"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("createOffersWorkflow - offer price links", () => {
            let appContainer: MedusaContainer

            beforeAll(() => {
                appContainer = getContainer()
            })

            // Regression: with many offers in a single call, several offers
            // land prices in the same variant price set. The offer↔price links
            // must be attributed by the `offer_id` price rule, not by the order
            // prices come back from the pricing module.
            it("links every price to the offer that owns it", async () => {
                const tag = `t${Date.now()}`
                const { seller, member, headers } = await createSellerUser(
                    appContainer,
                    { email: `links-${tag}@test.com`, name: "Links Seller" }
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

                const VARIANT_COUNT = 10
                const OFFERS_PER_VARIANT = 3

                const product = await createVendorProduct(api, headers, {
                    title: `Links Product ${tag}`,
                    variants: Array.from(
                        { length: VARIANT_COUNT },
                        (_, v) => ({ title: `V${v} ${tag}` })
                    ),
                })

                const offersInput = product.variants.flatMap((variant, v) =>
                    Array.from({ length: OFFERS_PER_VARIANT }, (_, o) => ({
                        seller_id: seller.id,
                        created_by: member.id,
                        variant_id: variant.id,
                        shipping_profile_id: shippingProfile.id,
                        sku: `S-${v}-${o}-${tag}`,
                        inventory_items: [
                            {
                                sku: `S-${v}-${o}-${tag}`,
                                stock_levels: [
                                    {
                                        location_id: stockLocation.id,
                                        stocked_quantity: 100,
                                    },
                                ],
                            },
                        ],
                        prices: [
                            {
                                amount: (v + 1) * 100 + o,
                                currency_code: "usd",
                            },
                        ],
                    }))
                )

                const { result: created } = await createOffersWorkflow(
                    appContainer
                ).run({ input: { offers: offersInput } })

                expect(created).toHaveLength(VARIANT_COUNT * OFFERS_PER_VARIANT)

                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )

                const { data: offers } = await query.graph({
                    entity: "offer",
                    fields: [
                        "id",
                        "prices.id",
                        "prices.price_rules.attribute",
                        "prices.price_rules.value",
                    ],
                    filters: { id: created.map((o) => o.id) },
                })

                for (const offer of offers) {
                    const prices = (offer.prices ?? []) as Array<{
                        id: string
                        price_rules?: Array<{
                            attribute: string
                            value: string
                        }>
                    }>

                    // Each offer must own exactly its own price, and that
                    // price's offer_id rule must point back at the offer.
                    expect(prices).toHaveLength(1)

                    for (const price of prices) {
                        const offerRule = (price.price_rules ?? []).find(
                            (r) => r.attribute === "offer_id"
                        )
                        expect(offerRule?.value).toBe(offer.id)
                    }
                }
            })
        })
    },
})
