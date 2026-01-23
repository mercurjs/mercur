import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IProductModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Collections", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: any
            let productModuleService: IProductModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                productModuleService = appContainer.resolve(Modules.PRODUCT)
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer, {
                    email: "seller@test.com",
                    name: "Test Seller",
                })
                sellerHeaders = result.headers
            })

            describe("GET /vendor/collections", () => {
                it("should list collections", async () => {
                    await productModuleService.createProductCollections([
                        { title: "Summer Collection", handle: "summer-collection" },
                        { title: "Winter Collection", handle: "winter-collection" },
                    ])

                    const response = await api.get(
                        `/vendor/collections`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.collections).toBeDefined()
                    expect(response.data.collections.length).toBeGreaterThanOrEqual(2)

                    const titles = response.data.collections.map((c: any) => c.title)
                    expect(titles).toContain("Summer Collection")
                    expect(titles).toContain("Winter Collection")
                })

                it("should filter collections by title", async () => {
                    await productModuleService.createProductCollections([
                        { title: "unique-collection-123", handle: "unique-123" },
                    ])

                    const response = await api.get(
                        `/vendor/collections?title=unique-collection-123`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.collections).toHaveLength(1)
                    expect(response.data.collections[0].title).toEqual("unique-collection-123")
                })

                it("should filter collections by handle", async () => {
                    await productModuleService.createProductCollections([
                        { title: "Handle Test", handle: "handle-test-collection" },
                    ])

                    const response = await api.get(
                        `/vendor/collections?handle=handle-test-collection`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.collections).toHaveLength(1)
                    expect(response.data.collections[0].handle).toEqual("handle-test-collection")
                })

                it("should search collections with q parameter", async () => {
                    await productModuleService.createProductCollections([
                        { title: "Searchable Collection", handle: "searchable" },
                    ])

                    const response = await api.get(
                        `/vendor/collections?q=searchable`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.collections.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.collections.some((c: any) =>
                            c.title.toLowerCase().includes("searchable") ||
                            c.handle.includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await productModuleService.createProductCollections([
                        { title: "Collection A", handle: "collection-a" },
                        { title: "Collection B", handle: "collection-b" },
                        { title: "Collection C", handle: "collection-c" },
                    ])

                    const response = await api.get(
                        `/vendor/collections?limit=2&offset=0`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.collections.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/collections/:id", () => {
                it("should get a collection by id", async () => {
                    const [collection] = await productModuleService.createProductCollections([
                        { title: "Get By Id Collection", handle: "get-by-id" },
                    ])

                    const response = await api.get(
                        `/vendor/collections/${collection.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.collection).toBeDefined()
                    expect(response.data.collection.id).toEqual(collection.id)
                    expect(response.data.collection.title).toEqual("Get By Id Collection")
                })

                it("should return 404 for non-existent collection", async () => {
                    const response = await api
                        .get(`/vendor/collections/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/collections/:id/products", () => {
                it("should add products to a collection", async () => {
                    const [collection] = await productModuleService.createProductCollections([
                        { title: "Products Collection", handle: "products-collection" },
                    ])

                    const productResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Product for Collection",
                            options: [{ title: "Default", values: ["Default"] }],
                        },
                        sellerHeaders
                    )

                    const productId = productResponse.data.product.id

                    const response = await api.post(
                        `/vendor/collections/${collection.id}/products`,
                        {
                            add: [productId],
                        },
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.collection).toBeDefined()
                })

                it("should remove products from a collection", async () => {
                    const [collection] = await productModuleService.createProductCollections([
                        { title: "Remove Products Collection", handle: "remove-products" },
                    ])

                    const productResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Product to Remove",
                            options: [{ title: "Default", values: ["Default"] }],
                        },
                        sellerHeaders
                    )

                    const productId = productResponse.data.product.id

                    await api.post(
                        `/vendor/collections/${collection.id}/products`,
                        {
                            add: [productId],
                        },
                        sellerHeaders
                    )

                    const response = await api.post(
                        `/vendor/collections/${collection.id}/products`,
                        {
                            remove: [productId],
                        },
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.collection).toBeDefined()
                })
            })
        })
    },
})
