import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Products", () => {
            let appContainer: MedusaContainer
            let seller1Headers: any
            let seller2Headers: any

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

            describe("POST /vendor/products", () => {
                it("should create a product with variant_attributes and variants", async () => {
                    const response = await api.post(
                        `/vendor/products`,
                        {
                            title: "Test Product",
                            description: "A test product",
                            variant_attributes: [
                                {
                                    name: "Size",
                                    type: "multi_select",
                                    is_variant_axis: true,
                                    values: ["S", "M", "L"],
                                },
                            ],
                            variants: [
                                {
                                    title: "Small",
                                    attribute_values: { Size: "S" },
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.product).toEqual(
                        expect.objectContaining({
                            title: "Test Product",
                            description: "A test product",
                        })
                    )
                })

                it("should create a simple product without variants", async () => {
                    const response = await api.post(
                        `/vendor/products`,
                        { title: "Simple Product" },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.product.title).toEqual("Simple Product")
                })
            })

            describe("GET /vendor/products", () => {
                it("should list only seller's own products", async () => {
                    await api.post(
                        `/vendor/products`,
                        { title: "Seller 1 Product" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/products`,
                        { title: "Seller 2 Product" },
                        seller2Headers
                    )

                    const response1 = await api.get(`/vendor/products`, seller1Headers)
                    expect(response1.status).toEqual(200)
                    expect(response1.data.products).toHaveLength(1)
                    expect(response1.data.products[0].title).toEqual("Seller 1 Product")

                    const response2 = await api.get(`/vendor/products`, seller2Headers)
                    expect(response2.status).toEqual(200)
                    expect(response2.data.products).toHaveLength(1)
                    expect(response2.data.products[0].title).toEqual("Seller 2 Product")
                })
            })

            describe("GET /vendor/products/:id", () => {
                it("should get seller's own product", async () => {
                    const createResponse = await api.post(
                        `/vendor/products`,
                        { title: "My Product" },
                        seller1Headers
                    )

                    const productId = createResponse.data.product.id

                    const response = await api.get(
                        `/vendor/products/${productId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product.id).toEqual(productId)
                })

                it("should allow any vendor to read the master catalog by product id", async () => {
                    const createResponse = await api.post(
                        `/vendor/products`,
                        { title: "Shared Master Product" },
                        seller1Headers
                    )

                    const productId = createResponse.data.product.id

                    const response = await api.get(
                        `/vendor/products/${productId}`,
                        seller2Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product.id).toEqual(productId)
                })
            })

            describe("POST /vendor/products/:id", () => {
                it("should stage a product update via product-edit (202)", async () => {
                    const createResponse = await api.post(
                        `/vendor/products`,
                        { title: "Original Title" },
                        seller1Headers
                    )

                    const productId = createResponse.data.product.id

                    const response = await api.post(
                        `/vendor/products/${productId}`,
                        {
                            title: "Updated Title",
                            description: "Updated description",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(202)
                    expect(response.data.product_change).toEqual(
                        expect.objectContaining({
                            product_id: productId,
                        })
                    )
                })
            })

            describe("DELETE /vendor/products/:id", () => {
                it("should stage a product delete via product-edit (202)", async () => {
                    const createResponse = await api.post(
                        `/vendor/products`,
                        { title: "Product to Delete" },
                        seller1Headers
                    )

                    const productId = createResponse.data.product.id

                    const response = await api.delete(
                        `/vendor/products/${productId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(202)
                    expect(response.data.product_change).toEqual(
                        expect.objectContaining({
                            product_id: productId,
                        })
                    )
                })
            })

            describe("POST /vendor/products/:id/variants", () => {
                it("should stage a variant add via product-edit (202)", async () => {
                    const createResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Product with Color Axis",
                            variant_attributes: [
                                {
                                    name: "Color",
                                    type: "multi_select",
                                    is_variant_axis: true,
                                    values: ["Red", "Blue"],
                                },
                            ],
                            variants: [
                                {
                                    title: "Red Variant",
                                    attribute_values: { Color: "Red" },
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const productId = createResponse.data.product.id

                    const response = await api.post(
                        `/vendor/products/${productId}/variants`,
                        {
                            title: "Blue Variant",
                            attribute_values: { Color: "Blue" },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(202)
                    expect(response.data.product_change).toEqual(
                        expect.objectContaining({
                            product_id: productId,
                        })
                    )
                })
            })

            describe("POST /vendor/products/:id/variants/:variant_id", () => {
                it("should stage a variant update via product-edit (202)", async () => {
                    const createResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Product",
                            variant_attributes: [
                                {
                                    name: "Size",
                                    type: "multi_select",
                                    is_variant_axis: true,
                                    values: ["S"],
                                },
                            ],
                            variants: [
                                {
                                    title: "Original Variant",
                                    sku: "SKU-001",
                                    attribute_values: { Size: "S" },
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const productId = createResponse.data.product.id
                    const variantId = createResponse.data.product.variants[0].id

                    const response = await api.post(
                        `/vendor/products/${productId}/variants/${variantId}`,
                        {
                            title: "Updated Variant",
                            sku: "SKU-002",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(202)
                    expect(response.data.product_change).toEqual(
                        expect.objectContaining({
                            product_id: productId,
                        })
                    )
                })
            })

            describe("DELETE /vendor/products/:id/variants/:variant_id", () => {
                it("should stage a variant delete via product-edit (202)", async () => {
                    const createResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Product",
                            variant_attributes: [
                                {
                                    name: "Size",
                                    type: "multi_select",
                                    is_variant_axis: true,
                                    values: ["S", "M"],
                                },
                            ],
                            variants: [
                                {
                                    title: "Small",
                                    attribute_values: { Size: "S" },
                                },
                                {
                                    title: "Medium",
                                    attribute_values: { Size: "M" },
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const productId = createResponse.data.product.id
                    const variantId = createResponse.data.product.variants[0].id

                    const response = await api.delete(
                        `/vendor/products/${productId}/variants/${variantId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(202)
                    expect(response.data.product_change).toEqual(
                        expect.objectContaining({
                            product_id: productId,
                        })
                    )
                })
            })
        })
    },
})
