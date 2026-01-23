import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IProductModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Product Categories", () => {
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

            describe("GET /vendor/product-categories", () => {
                it("should list product categories", async () => {
                    await productModuleService.createProductCategories([
                        { name: "Electronics", is_active: true },
                        { name: "Clothing", is_active: true },
                    ])

                    const response = await api.get(
                        `/vendor/product-categories`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_categories).toBeDefined()
                    expect(response.data.product_categories.length).toBeGreaterThanOrEqual(2)

                    const categoryNames = response.data.product_categories.map((c: any) => c.name)
                    expect(categoryNames).toContain("Electronics")
                    expect(categoryNames).toContain("Clothing")
                })

                it("should filter product categories by name", async () => {
                    await productModuleService.createProductCategories([
                        { name: "unique-category-123", is_active: true },
                    ])

                    const response = await api.get(
                        `/vendor/product-categories?name=unique-category-123`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_categories).toHaveLength(1)
                    expect(response.data.product_categories[0].name).toEqual("unique-category-123")
                })

                it("should search product categories with q parameter", async () => {
                    await productModuleService.createProductCategories([
                        { name: "searchable-category", is_active: true },
                    ])

                    const response = await api.get(
                        `/vendor/product-categories?q=searchable`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_categories.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.product_categories.some((c: any) => c.name.includes("searchable"))
                    ).toBe(true)
                })

                it("should filter by parent_category_id", async () => {
                    const [parentCategory] = await productModuleService.createProductCategories([
                        { name: "Parent Category", is_active: true },
                    ])

                    await productModuleService.createProductCategories([
                        { name: "Child Category", parent_category_id: parentCategory.id, is_active: true },
                    ])

                    const response = await api.get(
                        `/vendor/product-categories?parent_category_id=${parentCategory.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_categories).toHaveLength(1)
                    expect(response.data.product_categories[0].name).toEqual("Child Category")
                })

                it("should filter by is_active", async () => {
                    await productModuleService.createProductCategories([
                        { name: "Active Category", is_active: true },
                        { name: "Inactive Category", is_active: false },
                    ])

                    const response = await api.get(
                        `/vendor/product-categories?is_active=true`,
                        sellerHeaders
                    ).catch((e) => {
                        console.log("Create product category error:", e.response)
                        throw e
                    })

                    expect(response.status).toEqual(200)
                    expect(
                        response.data.product_categories.every((c: any) => c.is_active === true)
                    ).toBe(true)
                })
            })

            describe("GET /vendor/product-categories/:id", () => {
                it("should get a product category by id", async () => {
                    const [category] = await productModuleService.createProductCategories([
                        { name: "get-by-id-category", is_active: true },
                    ])

                    const response = await api.get(
                        `/vendor/product-categories/${category.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_category).toBeDefined()
                    expect(response.data.product_category.id).toEqual(category.id)
                    expect(response.data.product_category.name).toEqual("get-by-id-category")
                })

                it("should return 404 for non-existent category", async () => {
                    const response = await api
                        .get(`/vendor/product-categories/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/product-categories/:id/products", () => {
                it("should add products to a category", async () => {
                    const [category] = await productModuleService.createProductCategories([
                        { name: "Category for Products", is_active: true },
                    ])

                    const productResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Product for Category",
                            options: [{ title: "Default", values: ["Default"] }],
                        },
                        sellerHeaders
                    )

                    const productId = productResponse.data.product.id

                    const response = await api.post(
                        `/vendor/product-categories/${category.id}/products`,
                        {
                            add: [productId],
                        },
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_category).toBeDefined()
                })

                it("should remove products from a category", async () => {
                    const [category] = await productModuleService.createProductCategories([
                        { name: "Category for Removal", is_active: true },
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
                        `/vendor/product-categories/${category.id}/products`,
                        {
                            add: [productId],
                        },
                        sellerHeaders
                    )

                    const response = await api.post(
                        `/vendor/product-categories/${category.id}/products`,
                        {
                            remove: [productId],
                        },
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_category).toBeDefined()
                })

                it("should not allow seller to add another seller's product to category", async () => {
                    const [category] = await productModuleService.createProductCategories([
                        { name: "Category for Auth Test", is_active: true },
                    ])

                    const seller1ProductResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Seller 1 Product",
                            options: [{ title: "Default", values: ["Default"] }],
                        },
                        sellerHeaders
                    )

                    const seller1ProductId = seller1ProductResponse.data.product.id

                    const seller2Result = await createSellerUser(appContainer, {
                        email: "seller2@test.com",
                        name: "Seller Two",
                    })

                    const response = await api
                        .post(
                            `/vendor/product-categories/${category.id}/products`,
                            {
                                add: [seller1ProductId],
                            },
                            seller2Result.headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
