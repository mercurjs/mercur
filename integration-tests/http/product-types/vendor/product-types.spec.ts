import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IProductModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Product Types", () => {
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

            describe("GET /vendor/product-types", () => {
                it("should list product types", async () => {
                    await productModuleService.createProductTypes([
                        { value: "Physical" },
                        { value: "Digital" },
                    ])

                    const response = await api.get(
                        `/vendor/product-types`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_types).toBeDefined()
                    expect(response.data.product_types.length).toBeGreaterThanOrEqual(2)

                    const typeValues = response.data.product_types.map((t: any) => t.value)
                    expect(typeValues).toContain("Physical")
                    expect(typeValues).toContain("Digital")
                })

                it("should filter product types by value", async () => {
                    await productModuleService.createProductTypes([
                        { value: "unique-type-123" },
                    ])

                    const response = await api.get(
                        `/vendor/product-types?value=unique-type-123`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_types).toHaveLength(1)
                    expect(response.data.product_types[0].value).toEqual("unique-type-123")
                })

                it("should search product types with q parameter", async () => {
                    await productModuleService.createProductTypes([
                        { value: "searchable-type" },
                    ])

                    const response = await api.get(
                        `/vendor/product-types?q=searchable`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_types.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.product_types.some((t: any) => t.value.includes("searchable"))
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await productModuleService.createProductTypes([
                        { value: "Type A" },
                        { value: "Type B" },
                        { value: "Type C" },
                    ])

                    const response = await api.get(
                        `/vendor/product-types?limit=2&offset=0`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_types.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/product-types/:id", () => {
                it("should get a product type by id", async () => {
                    const [productType] = await productModuleService.createProductTypes([
                        { value: "get-by-id-type" },
                    ])

                    const response = await api.get(
                        `/vendor/product-types/${productType.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product_type).toBeDefined()
                    expect(response.data.product_type.id).toEqual(productType.id)
                    expect(response.data.product_type.value).toEqual("get-by-id-type")
                })

                it("should return 404 for non-existent type", async () => {
                    const response = await api
                        .get(`/vendor/product-types/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
