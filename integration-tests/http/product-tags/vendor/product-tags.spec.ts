import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IProductModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Product Tags", () => {
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

            describe("GET /vendor/product-tags", () => {
                it("should list product tags", async () => {
                    const [tag1, tag2] = await productModuleService.createProductTags([
                        { value: "summer" },
                        { value: "sale" },
                    ])

                    await api.post(
                        `/vendor/products`,
                        {
                            title: "Product with Tags",
                            options: [{ title: "Default", values: ["Default"] }],
                            tags: [{ id: tag1.id }, { id: tag2.id }],
                        },
                        sellerHeaders
                    )

                    const response = await api.get(
                        `/vendor/product-tags`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_tags).toBeDefined()
                    expect(response.data.product_tags.length).toBeGreaterThanOrEqual(2)

                    const tagValues = response.data.product_tags.map((t: any) => t.value)
                    expect(tagValues).toContain("summer")
                    expect(tagValues).toContain("sale")
                })

                it("should filter product tags by value", async () => {
                    const [tag] = await productModuleService.createProductTags([
                        { value: "unique-tag-123" },
                    ])

                    await api.post(
                        `/vendor/products`,
                        {
                            title: "Product with Unique Tag",
                            options: [{ title: "Default", values: ["Default"] }],
                            tags: [{ id: tag.id }],
                        },
                        sellerHeaders
                    )

                    const response = await api.get(
                        `/vendor/product-tags?value=unique-tag-123`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_tags).toHaveLength(1)
                    expect(response.data.product_tags[0].value).toEqual("unique-tag-123")
                })

                it("should search product tags with q parameter", async () => {
                    const [tag] = await productModuleService.createProductTags([
                        { value: "searchable-tag" },
                    ])

                    await api.post(
                        `/vendor/products`,
                        {
                            title: "Product for Search",
                            options: [{ title: "Default", values: ["Default"] }],
                            tags: [{ id: tag.id }],
                        },
                        sellerHeaders
                    )

                    const response = await api.get(
                        `/vendor/product-tags?q=searchable`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_tags.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.product_tags.some((t: any) => t.value.includes("searchable"))
                    ).toBe(true)
                })
            })

            describe("GET /vendor/product-tags/:id", () => {
                it("should get a product tag by id", async () => {
                    const [tag] = await productModuleService.createProductTags([
                        { value: "get-by-id-tag" },
                    ])

                    const response = await api.get(
                        `/vendor/product-tags/${tag.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_tag).toBeDefined()
                    expect(response.data.product_tag.id).toEqual(tag.id)
                    expect(response.data.product_tag.value).toEqual("get-by-id-tag")
                })

                it("should return 404 for non-existent tag", async () => {
                    const response = await api
                        .get(`/vendor/product-tags/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
