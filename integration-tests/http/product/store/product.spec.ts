import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Store - Products", () => {
            let appContainer: MedusaContainer
            let storeHeaders: ReturnType<typeof generateStoreHeaders>
            let salesChannel: any
            let approvedSeller: any
            let approvedSellerHeaders: any
            let suspendedSeller: any
            let suspendedSellerHeaders: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const salesChannelModule =
                    appContainer.resolve<ISalesChannelModuleService>(
                        Modules.SALES_CHANNEL
                    )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "Test Store",
                })

                const publishableKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey })

                const link = appContainer.resolve(
                    ContainerRegistrationKeys.LINK
                )
                await link.create({
                    [Modules.API_KEY]: {
                        publishable_key_id: publishableKey.id,
                    },
                    [Modules.SALES_CHANNEL]: {
                        sales_channel_id: salesChannel.id,
                    },
                })

                const approvedResult = await createSellerUser(appContainer, {
                    email: "approved-seller@test.com",
                    name: "Approved Store",
                })
                approvedSeller = approvedResult.seller
                approvedSellerHeaders = approvedResult.headers

                const suspendedResult = await createSellerUser(appContainer, {
                    email: "suspended-seller@test.com",
                    name: "Suspended Store",
                })
                suspendedSeller = suspendedResult.seller
                suspendedSellerHeaders = suspendedResult.headers

                await api.post(
                    `/admin/sellers/${approvedSeller.id}/approve`,
                    {},
                    adminHeaders
                )
                await api.post(
                    `/admin/sellers/${suspendedSeller.id}/approve`,
                    {},
                    adminHeaders
                )
            })

            const createProduct = async (
                headers: any,
                overrides: Record<string, any> = {}
            ) => {
                const response = await api.post(
                    `/vendor/products`,
                    {
                        title: "Test Product",
                        status: "published",
                        options: [{ title: "Size", values: ["M"] }],
                        variants: [
                            {
                                title: "M",
                                options: { Size: "M" },
                                prices: [
                                    { currency_code: "usd", amount: 1000 },
                                ],
                            },
                        ],
                        sales_channels: [{ id: salesChannel.id }],
                        ...overrides,
                    },
                    headers
                )
                return response.data.product
            }

            describe("GET /store/products", () => {
                it("should return 400 when publishable key header is missing", async () => {
                    const response = await api
                        .get(`/store/products`)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should list published products from approved sellers", async () => {
                    const product = await createProduct(approvedSellerHeaders, {
                        title: "Visible Product",
                    })

                    const response = await api.get(
                        `/store/products`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(Array.isArray(response.data.products)).toBe(true)
                    expect(response.data.count).toBeGreaterThanOrEqual(1)
                    expect(response.data.offset).toBeDefined()
                    expect(response.data.limit).toBeDefined()

                    const ids = response.data.products.map((p: any) => p.id)
                    expect(ids).toContain(product.id)
                })

                it("should not return draft products", async () => {
                    const draftProduct = await createProduct(
                        approvedSellerHeaders,
                        {
                            title: "Draft Product",
                            status: "draft",
                        }
                    )

                    const response = await api.get(
                        `/store/products`,
                        storeHeaders
                    )

                    const ids = response.data.products.map((p: any) => p.id)
                    expect(ids).not.toContain(draftProduct.id)
                })

                it("should not return products from suspended sellers", async () => {
                    const product = await createProduct(
                        suspendedSellerHeaders,
                        { title: "Suspended Seller Product" }
                    )

                    await api.post(
                        `/admin/sellers/${suspendedSeller.id}/suspend`,
                        {},
                        adminHeaders
                    )

                    const response = await api.get(
                        `/store/products`,
                        storeHeaders
                    )

                    const ids = response.data.products.map((p: any) => p.id)
                    expect(ids).not.toContain(product.id)
                })

                it("should not return products from sellers within closure window", async () => {
                    const product = await createProduct(approvedSellerHeaders, {
                        title: "Closed Seller Product",
                    })

                    const now = new Date()
                    const pastDate = new Date(
                        now.getTime() - 24 * 60 * 60 * 1000
                    ).toISOString()
                    const futureDate = new Date(
                        now.getTime() + 24 * 60 * 60 * 1000
                    ).toISOString()

                    await api.post(
                        `/admin/sellers/${approvedSeller.id}`,
                        {
                            closed_from: pastDate,
                            closed_to: futureDate,
                        },
                        adminHeaders
                    )

                    const response = await api.get(
                        `/store/products`,
                        storeHeaders
                    )

                    const ids = response.data.products.map((p: any) => p.id)
                    expect(ids).not.toContain(product.id)
                })

                it("should filter products by id", async () => {
                    const productA = await createProduct(
                        approvedSellerHeaders,
                        { title: "Product A" }
                    )
                    await createProduct(approvedSellerHeaders, {
                        title: "Product B",
                    })

                    const response = await api.get(
                        `/store/products?id=${productA.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.products).toHaveLength(1)
                    expect(response.data.products[0].id).toEqual(productA.id)
                })

                it("should support limit and offset", async () => {
                    await createProduct(approvedSellerHeaders, {
                        title: "Product 1",
                    })
                    await createProduct(approvedSellerHeaders, {
                        title: "Product 2",
                    })
                    await createProduct(approvedSellerHeaders, {
                        title: "Product 3",
                    })

                    const first = await api.get(
                        `/store/products?limit=1&offset=0`,
                        storeHeaders
                    )
                    const second = await api.get(
                        `/store/products?limit=1&offset=1`,
                        storeHeaders
                    )

                    expect(first.status).toEqual(200)
                    expect(second.status).toEqual(200)
                    expect(first.data.products).toHaveLength(1)
                    expect(second.data.products).toHaveLength(1)
                    expect(first.data.limit).toEqual(1)
                    expect(first.data.products[0].id).not.toEqual(
                        second.data.products[0].id
                    )
                })
            })

            describe("GET /store/products/:id", () => {
                it("should retrieve a single published product from an approved seller", async () => {
                    const product = await createProduct(approvedSellerHeaders, {
                        title: "Single Product",
                    })

                    const response = await api.get(
                        `/store/products/${product.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product).toBeDefined()
                    expect(response.data.product.id).toEqual(product.id)
                    expect(response.data.product.title).toEqual(
                        "Single Product"
                    )
                })

                it("should return 404 for a non-existent product", async () => {
                    const response = await api
                        .get(`/store/products/prod_nonexistent`, storeHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for a draft product", async () => {
                    const draftProduct = await createProduct(
                        approvedSellerHeaders,
                        {
                            title: "Draft Product",
                            status: "draft",
                        }
                    )

                    const response = await api
                        .get(
                            `/store/products/${draftProduct.id}`,
                            storeHeaders
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for a product from a suspended seller", async () => {
                    const product = await createProduct(
                        suspendedSellerHeaders,
                        { title: "Suspended Seller Product" }
                    )

                    await api.post(
                        `/admin/sellers/${suspendedSeller.id}/suspend`,
                        {},
                        adminHeaders
                    )

                    const response = await api
                        .get(`/store/products/${product.id}`, storeHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
