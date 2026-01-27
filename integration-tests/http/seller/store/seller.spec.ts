import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { generatePublishableKey, generateStoreHeaders } from "../../../helpers/create-admin-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Store - Sellers", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let activeSeller1: any
            let activeSeller2: any
            let pendingSeller: any
            let sellerModule: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                sellerModule = appContainer.resolve("seller")

                // Create active sellers
                activeSeller1 = await sellerModule.createSellers({
                    name: "Active Seller One",
                    handle: "active-seller-one",
                    email: "active1@test.com",
                    status: "active",
                })

                activeSeller2 = await sellerModule.createSellers({
                    name: "Active Seller Two",
                    handle: "active-seller-two",
                    email: "active2@test.com",
                    status: "active",
                })

                // Create pending seller (should not be visible in store)
                pendingSeller = await sellerModule.createSellers({
                    name: "Pending Seller",
                    handle: "pending-seller",
                    email: "pending@test.com",
                    status: "pending",
                })

                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
            })

            describe("GET /store/sellers", () => {
                it("should list only active sellers", async () => {
                    const response = await api.get(
                        `/store/sellers`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sellers).toHaveLength(2)
                    expect(response.data.sellers).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                id: activeSeller1.id,
                                name: "Active Seller One",
                                handle: "active-seller-one",
                            }),
                            expect.objectContaining({
                                id: activeSeller2.id,
                                name: "Active Seller Two",
                                handle: "active-seller-two",
                            }),
                        ])
                    )
                    // Should not include pending seller
                    expect(response.data.sellers.map((s: any) => s.id)).not.toContain(pendingSeller.id)
                })

                it("should filter sellers by handle", async () => {
                    const response = await api.get(
                        `/store/sellers?handle=active-seller-one`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sellers).toHaveLength(1)
                    expect(response.data.sellers[0]).toEqual(
                        expect.objectContaining({
                            id: activeSeller1.id,
                            handle: "active-seller-one",
                        })
                    )
                })

                it("should filter sellers by name", async () => {
                    const response = await api.get(
                        `/store/sellers?name=Active Seller Two`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sellers).toHaveLength(1)
                    expect(response.data.sellers[0]).toEqual(
                        expect.objectContaining({
                            id: activeSeller2.id,
                            name: "Active Seller Two",
                        })
                    )
                })

                it("should filter sellers by id", async () => {
                    const response = await api.get(
                        `/store/sellers?id=${activeSeller1.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sellers).toHaveLength(1)
                    expect(response.data.sellers[0].id).toEqual(activeSeller1.id)
                })

                it("should search sellers with q parameter", async () => {
                    const response = await api.get(
                        `/store/sellers?q=One`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sellers).toHaveLength(1)
                    expect(response.data.sellers[0]).toEqual(
                        expect.objectContaining({
                            id: activeSeller1.id,
                            name: "Active Seller One",
                        })
                    )
                })

                it("should support pagination", async () => {
                    const response = await api.get(
                        `/store/sellers?limit=1&offset=0`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.sellers).toHaveLength(1)
                    expect(response.data.count).toEqual(2)
                    expect(response.data.limit).toEqual(1)
                    expect(response.data.offset).toEqual(0)
                })

                it("should not expose sensitive fields like email", async () => {
                    const response = await api.get(
                        `/store/sellers`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    response.data.sellers.forEach((seller: any) => {
                        expect(seller.email).toBeUndefined()
                        expect(seller.phone).toBeUndefined()
                    })
                })
            })

            describe("GET /store/sellers/:id", () => {
                it("should get a single active seller by id", async () => {
                    const response = await api.get(
                        `/store/sellers/${activeSeller1.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.seller).toEqual(
                        expect.objectContaining({
                            id: activeSeller1.id,
                            name: "Active Seller One",
                            handle: "active-seller-one",
                        })
                    )
                })

                it("should return 404 for pending seller", async () => {
                    const response = await api
                        .get(`/store/sellers/${pendingSeller.id}`, storeHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent seller", async () => {
                    const response = await api
                        .get(`/store/sellers/non-existent-id`, storeHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should not expose sensitive fields like email", async () => {
                    const response = await api.get(
                        `/store/sellers/${activeSeller1.id}`,
                        storeHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.seller.email).toBeUndefined()
                    expect(response.data.seller.phone).toBeUndefined()
                })
            })
        })
    },
})
