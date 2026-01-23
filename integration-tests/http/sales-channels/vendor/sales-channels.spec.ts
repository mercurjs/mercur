import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ISalesChannelModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Sales Channels", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: any
            let salesChannelModuleService: ISalesChannelModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                salesChannelModuleService = appContainer.resolve(Modules.SALES_CHANNEL)
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer, {
                    email: "seller@test.com",
                    name: "Test Seller",
                })
                sellerHeaders = result.headers
            })

            describe("GET /vendor/sales-channels", () => {
                it("should list sales channels", async () => {
                    await salesChannelModuleService.createSalesChannels([
                        { name: "Online Store", description: "Main online store" },
                        { name: "Mobile App", description: "Mobile application" },
                    ])

                    const response = await api.get(
                        `/vendor/sales-channels`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sales_channels).toBeDefined()
                    expect(response.data.sales_channels.length).toBeGreaterThanOrEqual(2)

                    const names = response.data.sales_channels.map((sc: any) => sc.name)
                    expect(names).toContain("Online Store")
                    expect(names).toContain("Mobile App")
                })

                it("should filter sales channels by name", async () => {
                    await salesChannelModuleService.createSalesChannels([
                        { name: "unique-channel-123", description: "Unique channel" },
                    ])

                    const response = await api.get(
                        `/vendor/sales-channels?name=unique-channel-123`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sales_channels).toHaveLength(1)
                    expect(response.data.sales_channels[0].name).toEqual("unique-channel-123")
                })

                it("should search sales channels with q parameter", async () => {
                    await salesChannelModuleService.createSalesChannels([
                        { name: "Searchable Channel", description: "For search test" },
                    ])

                    const response = await api.get(
                        `/vendor/sales-channels?q=searchable`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sales_channels.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.sales_channels.some((sc: any) =>
                            sc.name.toLowerCase().includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await salesChannelModuleService.createSalesChannels([
                        { name: "Channel A", description: "A" },
                        { name: "Channel B", description: "B" },
                        { name: "Channel C", description: "C" },
                    ])

                    const response = await api.get(
                        `/vendor/sales-channels?limit=2&offset=0`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sales_channels.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/sales-channels/:id", () => {
                it("should get a sales channel by id", async () => {
                    const [salesChannel] = await salesChannelModuleService.createSalesChannels([
                        { name: "Get By Id Channel", description: "Test description" },
                    ])

                    const response = await api.get(
                        `/vendor/sales-channels/${salesChannel.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sales_channel).toBeDefined()
                    expect(response.data.sales_channel.id).toEqual(salesChannel.id)
                    expect(response.data.sales_channel.name).toEqual("Get By Id Channel")
                })

                it("should return 404 for non-existent sales channel", async () => {
                    const response = await api
                        .get(`/vendor/sales-channels/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/sales-channels/:id/products", () => {
                it("should add products to a sales channel", async () => {
                    const [salesChannel] = await salesChannelModuleService.createSalesChannels([
                        { name: "Products Channel", description: "Channel for products" },
                    ])

                    const productResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Product for Sales Channel",
                            options: [{ title: "Default", values: ["Default"] }],
                        },
                        sellerHeaders
                    )

                    const productId = productResponse.data.product.id

                    const response = await api.post(
                        `/vendor/sales-channels/${salesChannel.id}/products`,
                        {
                            add: [productId],
                        },
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sales_channel).toBeDefined()
                })

                it("should remove products from a sales channel", async () => {
                    const [salesChannel] = await salesChannelModuleService.createSalesChannels([
                        { name: "Remove Products Channel", description: "Channel for removal test" },
                    ])

                    const productResponse = await api.post(
                        `/vendor/products`,
                        {
                            title: "Product to Remove from Channel",
                            options: [{ title: "Default", values: ["Default"] }],
                        },
                        sellerHeaders
                    )

                    const productId = productResponse.data.product.id

                    await api.post(
                        `/vendor/sales-channels/${salesChannel.id}/products`,
                        {
                            add: [productId],
                        },
                        sellerHeaders
                    )

                    const response = await api.post(
                        `/vendor/sales-channels/${salesChannel.id}/products`,
                        {
                            remove: [productId],
                        },
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sales_channel).toBeDefined()
                })

                it("should not allow seller to add another seller's product to sales channel", async () => {
                    const [salesChannel] = await salesChannelModuleService.createSalesChannels([
                        { name: "Auth Test Channel", description: "For auth test" },
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
                            `/vendor/sales-channels/${salesChannel.id}/products`,
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
