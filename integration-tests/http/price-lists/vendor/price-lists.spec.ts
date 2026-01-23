import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Price Lists", () => {
            let appContainer: MedusaContainer
            let seller1: any
            let seller1Headers: any
            let seller2: any
            let seller2Headers: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const result1 = await createSellerUser(appContainer, {
                    email: "seller1@test.com",
                    name: "Seller One",
                })
                seller1 = result1.seller
                seller1Headers = result1.headers

                const result2 = await createSellerUser(appContainer, {
                    email: "seller2@test.com",
                    name: "Seller Two",
                })
                seller2 = result2.seller
                seller2Headers = result2.headers
            })

            describe("POST /vendor/price-lists", () => {
                it("should create a price list", async () => {
                    const response = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "VIP Price List",
                            description: "Special prices for VIP customers",
                            status: "active",
                            type: "sale",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.price_list).toBeDefined()
                    expect(response.data.price_list.title).toEqual("VIP Price List")
                    expect(response.data.price_list.description).toEqual("Special prices for VIP customers")
                })

                it("should create a price list with dates", async () => {
                    const startsAt = new Date()
                    const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

                    const response = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Flash Sale",
                            description: "Limited time offer",
                            status: "active",
                            type: "sale",
                            starts_at: startsAt.toISOString(),
                            ends_at: endsAt.toISOString(),
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.price_list.title).toEqual("Flash Sale")
                    expect(response.data.price_list.starts_at).toBeDefined()
                    expect(response.data.price_list.ends_at).toBeDefined()
                })
            })

            describe("GET /vendor/price-lists", () => {
                it("should list price lists", async () => {
                    await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Price List 1",
                            description: "Description 1",
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Price List 2",
                            description: "Description 2",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/price-lists`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_lists).toBeDefined()
                    expect(response.data.price_lists.length).toBeGreaterThanOrEqual(2)
                })

                it("should search price lists with q parameter", async () => {
                    await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Searchable Price List",
                            description: "For search test",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/price-lists?q=searchable`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_lists.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.price_lists.some((pl: any) =>
                            pl.title.toLowerCase().includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await api.post(
                        `/vendor/price-lists`,
                        { title: "List A", description: "A" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/price-lists`,
                        { title: "List B", description: "B" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/price-lists`,
                        { title: "List C", description: "C" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/price-lists?limit=2&offset=0`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_lists.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/price-lists/:id", () => {
                it("should get seller's own price list", async () => {
                    const createResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "My Price List",
                            description: "My description",
                        },
                        seller1Headers
                    )

                    const priceListId = createResponse.data.price_list.id

                    const response = await api.get(
                        `/vendor/price-lists/${priceListId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_list).toBeDefined()
                    expect(response.data.price_list.id).toEqual(priceListId)
                    expect(response.data.price_list.title).toEqual("My Price List")
                })

                it("should not allow seller to get another seller's price list", async () => {
                    const createResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Seller 1 Price List",
                            description: "Seller 1 description",
                        },
                        seller1Headers
                    )

                    const priceListId = createResponse.data.price_list.id

                    const response = await api
                        .get(`/vendor/price-lists/${priceListId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/price-lists/:id", () => {
                it("should update seller's own price list", async () => {
                    const createResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Original Title",
                            description: "Original description",
                        },
                        seller1Headers
                    )

                    const priceListId = createResponse.data.price_list.id

                    const response = await api.post(
                        `/vendor/price-lists/${priceListId}`,
                        {
                            title: "Updated Title",
                            description: "Updated description",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_list.title).toEqual("Updated Title")
                    expect(response.data.price_list.description).toEqual("Updated description")
                })

                it("should update price list status", async () => {
                    const createResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Status Test",
                            description: "Test description",
                            status: "draft",
                        },
                        seller1Headers
                    )

                    const priceListId = createResponse.data.price_list.id

                    const response = await api.post(
                        `/vendor/price-lists/${priceListId}`,
                        {
                            status: "active",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_list.status).toEqual("active")
                })

                it("should not allow seller to update another seller's price list", async () => {
                    const createResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Seller 1 Price List",
                            description: "Seller 1 description",
                        },
                        seller1Headers
                    )

                    const priceListId = createResponse.data.price_list.id

                    const response = await api
                        .post(
                            `/vendor/price-lists/${priceListId}`,
                            { title: "Hacked Title" },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/price-lists/:id", () => {
                it("should delete seller's own price list", async () => {
                    const createResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Price List to Delete",
                            description: "Will be deleted",
                        },
                        seller1Headers
                    )

                    const priceListId = createResponse.data.price_list.id

                    const response = await api.delete(
                        `/vendor/price-lists/${priceListId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: priceListId,
                        object: "price_list",
                        deleted: true,
                    })

                    const getResponse = await api
                        .get(`/vendor/price-lists/${priceListId}`, seller1Headers)
                        .catch((e) => e.response)

                    expect(getResponse.status).toEqual(404)
                })

                it("should not allow seller to delete another seller's price list", async () => {
                    const createResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Seller 1 Price List",
                            description: "Seller 1 description",
                        },
                        seller1Headers
                    )

                    const priceListId = createResponse.data.price_list.id

                    const response = await api
                        .delete(`/vendor/price-lists/${priceListId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)

                    const getResponse = await api.get(
                        `/vendor/price-lists/${priceListId}`,
                        seller1Headers
                    )

                    expect(getResponse.status).toEqual(200)
                })
            })

            describe("POST /vendor/price-lists/:id/products", () => {
                it("should remove products from price list", async () => {
                    const productResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Product for Price List",
                            options: [{ title: "Default", values: ["Default"] }],
                            variants: [
                                {
                                    title: "Default Variant",
                                    options: { Default: "Default" },
                                    prices: [{ currency_code: "usd", amount: 1000 }],
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const productId = productResponse.data.product.id
                    const variantId = productResponse.data.product.variants[0].id

                    const priceListResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Price List with Products",
                            description: "Test price list",
                            prices: [
                                {
                                    variant_id: variantId,
                                    currency_code: "usd",
                                    amount: 800,
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const priceListId = priceListResponse.data.price_list.id

                    const response = await api.post(
                        `/vendor/price-lists/${priceListId}/products`,
                        {
                            remove: [productId],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_list).toBeDefined()
                })

                it("should return error when no products provided", async () => {
                    const priceListResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Empty Remove Test",
                            description: "Test price list",
                        },
                        seller1Headers
                    )

                    const priceListId = priceListResponse.data.price_list.id

                    const response = await api
                        .post(
                            `/vendor/price-lists/${priceListId}/products`,
                            {
                                remove: [],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should not allow seller to remove products from another seller's price list", async () => {
                    const productResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Seller 1 Product",
                            options: [{ title: "Default", values: ["Default"] }],
                            variants: [
                                {
                                    title: "Default Variant",
                                    options: { Default: "Default" },
                                    prices: [{ currency_code: "usd", amount: 1000 }],
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const productId = productResponse.data.product.id
                    const variantId = productResponse.data.product.variants[0].id

                    const priceListResponse = await api.post(
                        `/vendor/price-lists`,
                        {
                            title: "Seller 1 Price List",
                            description: "Seller 1 description",
                            prices: [
                                {
                                    variant_id: variantId,
                                    currency_code: "usd",
                                    amount: 800,
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const priceListId = priceListResponse.data.price_list.id

                    const response = await api
                        .post(
                            `/vendor/price-lists/${priceListId}/products`,
                            {
                                remove: [productId],
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
