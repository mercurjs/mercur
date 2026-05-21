import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Offers", () => {
            let appContainer: MedusaContainer
            let seller1Headers: any
            let seller2Headers: any

            let seedCounter = 0
            const seedSellerOfferDeps = async (headers: any) => {
                const idx = ++seedCounter
                const tag = `t${idx}${Date.now()}`
                const ean = `${tag}`.padEnd(13, "0").slice(0, 13)
                const upc = `${tag}`.padEnd(12, "0").slice(0, 12)
                const product = await api.post(
                    `/vendor/products`,
                    {
                        title: `Test Product ${tag}`,
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
                                attribute_values: {
                                    [`Default ${tag}`]: "Default",
                                },
                                ean,
                                upc,
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
                    { name: `Standard ${tag}`, type: "default" },
                    headers
                )

                return {
                    variant_id: variant.id,
                    inventory_item_id:
                        inventoryItem.data.inventory_item.id,
                    shipping_profile_id:
                        shippingProfile.data.shipping_profile.id,
                    ean,
                    upc,
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
                            ean: deps.ean,
                            upc: deps.upc,
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

                    expect(response.status).toEqual(400)
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

            describe("POST /vendor/offers/:id (update)", () => {
                it("should update offer-row fields without touching prices", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "UPD-SKU-1",
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

                    const offerId = created.data.offer.id

                    const response = await api.post(
                        `/vendor/offers/${offerId}`,
                        { sku: "UPD-SKU-1-RENAMED" },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.offer.sku).toEqual(
                        "UPD-SKU-1-RENAMED"
                    )
                    expect(response.data.offer.price_set.prices).toHaveLength(
                        1
                    )
                    expect(response.data.offer.price_set.prices[0]).toEqual(
                        expect.objectContaining({
                            amount: 1000,
                            currency_code: "usd",
                        })
                    )
                })

                it("should add, update, and delete prices in one call (replace semantics)", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "PRICE-LADDER",
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
                                { amount: 900, currency_code: "eur" },
                            ],
                        },
                        seller1Headers
                    )

                    const offerId = created.data.offer.id
                    const prices = created.data.offer.price_set.prices as Array<{
                        id: string
                        currency_code: string
                        amount: number
                    }>
                    const usdPrice = prices.find(
                        (p) => p.currency_code === "usd"
                    )!

                    const response = await api.post(
                        `/vendor/offers/${offerId}`,
                        {
                            prices: [
                                {
                                    id: usdPrice.id,
                                    amount: 1500,
                                    currency_code: "usd",
                                },
                                { amount: 1200, currency_code: "gbp" },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    const updated = response.data.offer.price_set
                        .prices as Array<{
                        currency_code: string
                        amount: number
                    }>
                    expect(updated).toHaveLength(2)
                    expect(
                        updated.find((p) => p.currency_code === "usd")
                    ).toEqual(
                        expect.objectContaining({ amount: 1500 })
                    )
                    expect(
                        updated.find((p) => p.currency_code === "gbp")
                    ).toEqual(
                        expect.objectContaining({ amount: 1200 })
                    )
                    expect(
                        updated.find((p) => p.currency_code === "eur")
                    ).toBeUndefined()
                })

                it("should not allow seller to update another seller's offer", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "CROSS-UPDATE",
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

                    const response = await api
                        .post(
                            `/vendor/offers/${created.data.offer.id}`,
                            { sku: "HIJACK" },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/offers/:id/inventory-items/batch", () => {
                const seedExtraInventoryItem = async (
                    headers: any,
                    title: string
                ) => {
                    const r = await api.post(
                        `/vendor/inventory-items`,
                        { title },
                        headers
                    )
                    return r.data.inventory_item.id as string
                }

                it("should create, update, and delete links in one call", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)
                    const extraId = await seedExtraInventoryItem(
                        seller1Headers,
                        "Extra Inventory Item"
                    )

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "BATCH-OFFER",
                            variant_id: deps.variant_id,
                            shipping_profile_id: deps.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps.inventory_item_id,
                                    required_quantity: 2,
                                },
                            ],
                            prices: [
                                { amount: 1000, currency_code: "usd" },
                            ],
                        },
                        seller1Headers
                    )

                    const offerId = created.data.offer.id

                    // Add the extra link, then in a second call delete the
                    // original and update the extra so the offer keeps a
                    // single inventory item linked at required_quantity=7.
                    const addResp = await api.post(
                        `/vendor/offers/${offerId}/inventory-items/batch`,
                        {
                            create: [
                                {
                                    inventory_item_id: extraId,
                                    required_quantity: 3,
                                },
                            ],
                        },
                        seller1Headers
                    )
                    expect(addResp.status).toEqual(200)
                    expect(addResp.data.created).toHaveLength(1)
                    expect(addResp.data.offer.inventory_items).toHaveLength(
                        2
                    )

                    const mutateResp = await api.post(
                        `/vendor/offers/${offerId}/inventory-items/batch`,
                        {
                            update: [
                                {
                                    inventory_item_id: extraId,
                                    required_quantity: 7,
                                },
                            ],
                            delete: [deps.inventory_item_id],
                        },
                        seller1Headers
                    )

                    expect(mutateResp.status).toEqual(200)
                    expect(mutateResp.data.updated).toHaveLength(1)
                    expect(mutateResp.data.deleted).toEqual([
                        deps.inventory_item_id,
                    ])
                    // NOTE: the offer→inventory_items writable M:N link exposes
                    // the linked InventoryItem entity (id, sku) but does not
                    // currently surface the pivot's extra column
                    // `required_quantity` through Query traversal. Until that
                    // exposure is wired (separate ticket), the assertion only
                    // verifies the remaining linked inventory item is the
                    // expected one.
                    const links = mutateResp.data.offer
                        .inventory_items as Array<{ id: string }>
                    expect(links).toHaveLength(1)
                    expect(links[0].id).toEqual(extraId)
                })

                it("should reject duplicate inventory_item_id within create", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)
                    const extraId = await seedExtraInventoryItem(
                        seller1Headers,
                        "Dup Inventory Item"
                    )

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "BATCH-DUP",
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

                    const response = await api
                        .post(
                            `/vendor/offers/${created.data.offer.id}/inventory-items/batch`,
                            {
                                create: [
                                    { inventory_item_id: extraId },
                                    { inventory_item_id: extraId },
                                ],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should reject delete of an inventory item not linked to the offer", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)
                    const otherId = await seedExtraInventoryItem(
                        seller1Headers,
                        "Unlinked Inventory Item"
                    )

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "BATCH-MISSING",
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

                    const response = await api
                        .post(
                            `/vendor/offers/${created.data.offer.id}/inventory-items/batch`,
                            { delete: [otherId] },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should not allow seller to batch another seller's offer", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)
                    const otherSellerInventoryId =
                        await seedExtraInventoryItem(
                            seller2Headers,
                            "Seller2 Inventory"
                        )

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "BATCH-CROSS",
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

                    const response = await api
                        .post(
                            `/vendor/offers/${created.data.offer.id}/inventory-items/batch`,
                            {
                                create: [
                                    {
                                        inventory_item_id:
                                            otherSellerInventoryId,
                                    },
                                ],
                            },
                            seller2Headers
                        )
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

            describe("PriceSet invariants", () => {
                it("assigns distinct price_set_ids to sibling offers on the same variant", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)
                    const otherInventory = await api.post(
                        `/vendor/inventory-items`,
                        { title: "Sibling Inv" },
                        seller1Headers
                    )

                    const offerA = (
                        await api.post(
                            `/vendor/offers`,
                            {
                                sku: "SIBLING-A",
                                variant_id: deps.variant_id,
                                shipping_profile_id:
                                    deps.shipping_profile_id,
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
                    ).data.offer
                    const offerB = (
                        await api.post(
                            `/vendor/offers`,
                            {
                                sku: "SIBLING-B",
                                variant_id: deps.variant_id,
                                shipping_profile_id:
                                    deps.shipping_profile_id,
                                inventory_items: [
                                    {
                                        inventory_item_id:
                                            otherInventory.data.inventory_item
                                                .id,
                                    },
                                ],
                                prices: [
                                    { amount: 2000, currency_code: "usd" },
                                ],
                            },
                            seller1Headers
                        )
                    ).data.offer

                    expect(offerA.price_set_id).toBeDefined()
                    expect(offerB.price_set_id).toBeDefined()
                    expect(offerA.price_set_id).not.toEqual(
                        offerB.price_set_id
                    )
                })

                it("keeps offer.price_set resolvable via Query after soft-delete", async () => {
                    const deps = await seedSellerOfferDeps(seller1Headers)

                    const created = await api.post(
                        `/vendor/offers`,
                        {
                            sku: "HISTORIC",
                            variant_id: deps.variant_id,
                            shipping_profile_id:
                                deps.shipping_profile_id,
                            inventory_items: [
                                {
                                    inventory_item_id:
                                        deps.inventory_item_id,
                                },
                            ],
                            prices: [
                                { amount: 4321, currency_code: "usd" },
                            ],
                        },
                        seller1Headers
                    )
                    const offerId = created.data.offer.id

                    await api.delete(
                        `/vendor/offers/${offerId}`,
                        seller1Headers
                    )

                    const query = appContainer.resolve(
                        ContainerRegistrationKeys.QUERY
                    )
                    const { data: rows } = await query.graph({
                        entity: "offer",
                        fields: [
                            "id",
                            "deleted_at",
                            "price_set.id",
                            "price_set.prices.amount",
                            "price_set.prices.currency_code",
                        ],
                        filters: { id: offerId },
                        withDeleted: true,
                    })

                    expect(rows).toHaveLength(1)
                    const row = rows[0] as any
                    expect(row.deleted_at).not.toBeNull()
                    expect(row.price_set?.id).toBeDefined()
                    expect(row.price_set.prices).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                amount: 4321,
                                currency_code: "usd",
                            }),
                        ])
                    )
                })
            })
        })
    },
})
