import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IProductModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
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
            let productModuleService: IProductModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                productModuleService = appContainer.resolve(Modules.PRODUCT)
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

            // Products are master records. The `product_seller` allowlist is
            // opt-in (empty = open to every seller), so it no longer gates
            // store visibility; the store lists any published product. The
            // helper still assigns each product to the seller whose headers
            // created it to mirror how vendors submit against a master product.
            const createProduct = async (
                headers: any,
                overrides: Record<string, any> = {}
            ) => {
                const response = await api.post(
                    `/vendor/products`,
                    {
                        title: "Test Product",
                        status: "published",
                        ...overrides,
                    },
                    headers
                )
                const product = response.data.product

                const seller =
                    headers === suspendedSellerHeaders
                        ? suspendedSeller
                        : approvedSeller
                const link = appContainer.resolve(
                    ContainerRegistrationKeys.LINK
                )
                await link.create({
                    [Modules.PRODUCT]: { product_id: product.id },
                    [MercurModules.SELLER]: { seller_id: seller.id },
                })

                return product
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

                // The `product_seller` allowlist is opt-in and no longer gates
                // store visibility, so a published product stays listed even
                // when its assigned seller is suspended.
                it("should still list published products from suspended sellers", async () => {
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
                    expect(ids).toContain(product.id)
                })

                it("should still list published products from sellers within a closure window", async () => {
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
                    expect(ids).toContain(product.id)
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

                // Regression for https://github.com/mercurjs/mercur/issues/974
                // `category_id` is a Medusa-standard store filter param but is
                // not a column on `Product`; the override route used to forward
                // it straight to `query.graph`, raising
                // `Trying to query by not existing property Product.category_id`.
                it("should filter products by category_id", async () => {
                    const [category] =
                        await productModuleService.createProductCategories([
                            {
                                name: "Filterable Category",
                                is_active: true,
                            },
                        ])

                    const inCategory = await createProduct(
                        approvedSellerHeaders,
                        { title: "In Category" }
                    )
                    const outOfCategory = await createProduct(
                        approvedSellerHeaders,
                        { title: "Out Of Category" }
                    )

                    await api.post(
                        `/vendor/product-categories/${category.id}/products`,
                        { add: [inCategory.id] },
                        approvedSellerHeaders
                    )

                    const response = await api.get(
                        `/store/products?category_id=${category.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    const ids = response.data.products.map((p: any) => p.id)
                    expect(ids).toContain(inCategory.id)
                    expect(ids).not.toContain(outOfCategory.id)
                })

                it("should not return products from an inactive category", async () => {
                    const [inactiveCategory] =
                        await productModuleService.createProductCategories([
                            {
                                name: "Inactive Category",
                                is_active: false,
                            },
                        ])

                    const product = await createProduct(approvedSellerHeaders, {
                        title: "Hidden Category Product",
                    })

                    await api.post(
                        `/vendor/product-categories/${inactiveCategory.id}/products`,
                        { add: [product.id] },
                        approvedSellerHeaders
                    )

                    const response = await api.get(
                        `/store/products?category_id=${inactiveCategory.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    const ids = response.data.products.map((p: any) => p.id)
                    expect(ids).not.toContain(product.id)
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

                it("surfaces linked attributes on product.attributes", async () => {
                    const product = await createProduct(approvedSellerHeaders, {
                        title: "Product with attribute",
                        attributes: [
                            {
                                title: "Size",
                                type: "multi_select",
                                values: ["M"],
                            },
                        ],
                    })

                    const response = await api.get(
                        `/store/products/${product.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    const attrs = response.data.product.attributes
                    expect(Array.isArray(attrs)).toBe(true)
                    const sizeAttr = attrs.find(
                        (a: any) => a.name === "Size"
                    )
                    expect(sizeAttr).toBeDefined()
                    expect(
                        sizeAttr.values.map((v: any) => v.name)
                    ).toEqual(["M"])
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

                // Suspending the assigned seller no longer hides a published
                // product from the store detail route.
                it("should still retrieve a published product from a suspended seller", async () => {
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
                        `/store/products/${product.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.product.id).toEqual(product.id)
                })
            })
        })
    },
})
