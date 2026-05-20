import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Offers", () => {
            let appContainer: MedusaContainer
            let seller1Headers: any
            let seller2Headers: any

            const seedSellerOfferDeps = async (headers: any) => {
                const product = await api.post(
                    `/vendor/products`,
                    {
                        title: "Test Product",
                        options: [{ title: "Default", values: ["Default"] }],
                        variants: [
                            {
                                title: "Default",
                                options: { Default: "Default" },
                                ean: "1234567890123",
                                upc: "012345678905",
                                prices: [{ currency_code: "usd", amount: 1000 }],
                            },
                        ],
                    },
                    headers
                )

                const variant = product.data.product.variants[0]

                const inventoryItem = await api.post(
                    `/vendor/inventory-items`,
                    { title: "Inventory Item A" },
                    headers
                )

                const shippingProfile = await api.post(
                    `/vendor/shipping-profiles`,
                    { name: "Standard", type: "default" },
                    headers
                )

                return {
                    variant_id: variant.id,
                    inventory_item_id:
                        inventoryItem.data.inventory_item.id,
                    shipping_profile_id:
                        shippingProfile.data.shipping_profile.id,
                }
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const result1 = await createSellerUser(appContainer, {
                    email: "seller1@test.com",
                    name: "Seller One",
                })
                seller1Headers = result1.headers

                const result2 = await createSellerUser(appContainer, {
                    email: "seller2@test.com",
                    name: "Seller Two",
                })
                seller2Headers = result2.headers
            })

            describe("POST /vendor/offers", () => {
                it("should create an offer with seeded prices and one inventory link", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const response = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "SELLER1-SKU-001",
                            variant_id: deps.variant_id,
                            shipping_profile_id: deps.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id: deps.inventory_item_id,
                                    required_quantity: 1,
                                },
                            ],
                            prices: [{ amount: 2000, currency_code: "usd" }],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.offer).toEqual(
                        expect.objectContaining({
                            sku: "SELLER1-SKU-001",
                            variant_id: deps.variant_id,
                            shipping_profile_id: deps.shipping_profile_id,
                            ean: "1234567890123",
                            upc: "012345678905",
                        })
                    )
                    expect(response.data.offer.price_set_id).toBeDefined()
                })

                it("should reject create when variant does not exist", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const response = await api
                        .post(
                            `/vendor/offers`,
                            {
                                sku: "SELLER1-SKU-002",
                                variant_id: "variant_does_not_exist",
                                shipping_profile_id: deps.shipping_profile_id,
                                inventory_items: [
                                    {
                                        inventory_item_id:
                                            deps.inventory_item_id,
                                    },
                                ],
                                prices: [
                                    { amount: 2000, currency_code: "usd" },
                                ],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should reject duplicate sku for the same seller", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: "DUPLICATE-SKU",
                            variant_id: deps.variant_id,
                            shipping_profile_id: deps.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id: deps.inventory_item_id,
                                },
                            ],
                            prices: [{ amount: 1000, currency_code: "usd" }],
                        },
                        seller1Headers
                    )

                    const response = await api
                        .post(
                            `/vendor/offers`,
                            {
                                sku: "DUPLICATE-SKU",
                                variant_id: deps.variant_id,
                                shipping_profile_id: deps.shipping_profile_id,
                                inventory_items: [
                                    {
                                        inventory_item_id:
                                            deps.inventory_item_id,
                                    },
                                ],
                                prices: [
                                    { amount: 1000, currency_code: "usd" },
                                ],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(409)
                })

                it("should allow two sellers to use the same sku independently", async () => {
                    const deps1 = await seedSellerOfferDeps(seller1Headers)
                    const deps2 = await seedSellerOfferDeps(seller2Headers)

                    const r1 = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "SHARED-SKU",
                            variant_id: deps1.variant_id,
                            shipping_profile_id: deps1.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps1.inventory_item_id,
                                },
                            ],
                            prices: [{ amount: 1000, currency_code: "usd" }],
                        },
                        seller1Headers
                    )

                    const r2 = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "SHARED-SKU",
                            variant_id: deps2.variant_id,
                            shipping_profile_id: deps2.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps2.inventory_item_id,
                                },
                            ],
                            prices: [{ amount: 1500, currency_code: "usd" }],
                        },
                        seller2Headers
                    )

                    expect(r1.status).toEqual(201)
                    expect(r2.status).toEqual(201)
                })

                it("should allow a single seller to create multiple offers on the same variant with distinct sku", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const r1 = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "PACK-1",
                            variant_id: deps.variant_id,
                            shipping_profile_id: deps.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps.inventory_item_id,
                                },
                            ],
                            prices: [{ amount: 1000, currency_code: "usd" }],
                        },
                        seller1Headers
                    )

                    const r2 = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "PACK-2",
                            variant_id: deps.variant_id,
                            shipping_profile_id: deps.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps.inventory_item_id,
                                    required_quantity: 5,
                                },
                            ],
                            prices: [{ amount: 4500, currency_code: "usd" }],
                        },
                        seller1Headers
                    )

                    expect(r1.status).toEqual(201)
                    expect(r2.status).toEqual(201)
                })

                it("should reject duplicate inventory_item_id within the create payload", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const response = await api
                        .post(
                            `/vendor/offers`,
                            {
                                sku: "BAD-PAYLOAD",
                                variant_id: deps.variant_id,
                                shipping_profile_id:
                                    deps.shipping_profile_id,
                                inventory_items: [
                                    {
                                        inventory_item_id:
                                            deps.inventory_item_id,
                                    },
                                    {
                                        inventory_item_id:
                                            deps.inventory_item_id,
                                    },
                                ],
                                prices: [
                                    { amount: 1000, currency_code: "usd" },
                                ],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })
            })

            describe("GET /vendor/offers", () => {
                it("should list only the seller's own offers", async () => {
                    const deps1 = await seedSellerOfferDeps(seller1Headers)
                    const deps2 = await seedSellerOfferDeps(seller2Headers)

                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: "S1-LIST",
                            variant_id: deps1.variant_id,
                            shipping_profile_id: deps1.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps1.inventory_item_id,
                                },
                            ],
                            prices: [{ amount: 1000, currency_code: "usd" }],
                        },
                        seller1Headers
                    )
                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: "S2-LIST",
                            variant_id: deps2.variant_id,
                            shipping_profile_id: deps2.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps2.inventory_item_id,
                                },
                            ],
                            prices: [{ amount: 1000, currency_code: "usd" }],
                        },
                        seller2Headers
                    )

                    const r1 = await api.get(`/vendor/offers`, seller1Headers)
                    expect(r1.status).toEqual(200)
                    expect(r1.data.offers).toHaveLength(1)
                    expect(r1.data.offers[0].sku).toEqual("S1-LIST")
                })
            })

            describe("GET /vendor/offers/:id", () => {
                it("should not allow seller to read another seller's offer", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "S1-PRIVATE",
                            variant_id: deps.variant_id,
                            shipping_profile_id: deps.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps.inventory_item_id,
                                },
                            ],
                            prices: [{ amount: 1000, currency_code: "usd" }],
                        },
                        seller1Headers
                    )

                    const offerId = created.data.offer.id

                    const response = await api
                        .get(`/vendor/offers/${offerId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/offers/:id", () => {
                it("should soft-delete the seller's own offer", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "TO-DELETE",
                            variant_id: deps.variant_id,
                            shipping_profile_id: deps.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps.inventory_item_id,
                                },
                            ],
                            prices: [{ amount: 1000, currency_code: "usd" }],
                        },
                        seller1Headers
                    )

                    const offerId = created.data.offer.id

                    const response = await api.delete(
                        `/vendor/offers/${offerId}`,
                        seller1Headers
                    )
                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: offerId,
                        object: "offer",
                        deleted: true,
                    })

                    const after = await api
                        .get(`/vendor/offers/${offerId}`, seller1Headers)
                        .catch((e) => e.response)
                    expect(after.status).toEqual(404)
                })
            })
        })
    },
})
