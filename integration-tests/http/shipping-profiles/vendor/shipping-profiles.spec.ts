import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Shipping Profiles", () => {
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

            describe("POST /vendor/shipping-profiles", () => {
                it("should create a shipping profile", async () => {
                    const response = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Standard Shipping",
                            type: "default",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.shipping_profile).toBeDefined()
                    expect(response.data.shipping_profile.name).toEqual("Standard Shipping")
                    expect(response.data.shipping_profile.type).toEqual("default")
                })

                it("should create a shipping profile with metadata", async () => {
                    const response = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Express Shipping",
                            type: "express",
                            metadata: {
                                delivery_days: 1,
                                priority: "high",
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.shipping_profile.name).toEqual("Express Shipping")
                    expect(response.data.shipping_profile.type).toEqual("express")
                })

                it("should create a gift card shipping profile", async () => {
                    const response = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Gift Card Delivery",
                            type: "gift_card",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.shipping_profile.type).toEqual("gift_card")
                })
            })

            describe("GET /vendor/shipping-profiles", () => {
                it("should list shipping profiles", async () => {
                    await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Profile 1",
                            type: "default",
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Profile 2",
                            type: "express",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/shipping-profiles`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_profiles).toBeDefined()
                    expect(response.data.shipping_profiles.length).toBeGreaterThanOrEqual(2)
                })

                it("should search shipping profiles with q parameter", async () => {
                    await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Searchable Profile",
                            type: "default",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/shipping-profiles?q=searchable`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_profiles.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.shipping_profiles.some((sp: any) =>
                            sp.name.toLowerCase().includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should filter shipping profiles by type", async () => {
                    await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Default Profile",
                            type: "default",
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Express Profile",
                            type: "express",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/shipping-profiles?type=express`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(
                        response.data.shipping_profiles.every((sp: any) => sp.type === "express")
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: "Profile A", type: "default" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: "Profile B", type: "default" },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: "Profile C", type: "default" },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/shipping-profiles?limit=2&offset=0`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_profiles.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/shipping-profiles/:id", () => {
                it("should get seller's own shipping profile", async () => {
                    const createResponse = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "My Shipping Profile",
                            type: "default",
                        },
                        seller1Headers
                    )

                    const profileId = createResponse.data.shipping_profile.id

                    const response = await api.get(
                        `/vendor/shipping-profiles/${profileId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_profile).toBeDefined()
                    expect(response.data.shipping_profile.id).toEqual(profileId)
                    expect(response.data.shipping_profile.name).toEqual("My Shipping Profile")
                })

                it("should not allow seller to get another seller's shipping profile", async () => {
                    const createResponse = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Seller 1 Profile",
                            type: "default",
                        },
                        seller1Headers
                    )

                    const profileId = createResponse.data.shipping_profile.id

                    const response = await api
                        .get(`/vendor/shipping-profiles/${profileId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/shipping-profiles/:id", () => {
                it("should update seller's own shipping profile", async () => {
                    const createResponse = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Original Name",
                            type: "default",
                        },
                        seller1Headers
                    )

                    const profileId = createResponse.data.shipping_profile.id

                    const response = await api.post(
                        `/vendor/shipping-profiles/${profileId}`,
                        {
                            name: "Updated Name",
                            type: "express",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_profile.name).toEqual("Updated Name")
                    expect(response.data.shipping_profile.type).toEqual("express")
                })

                it("should update shipping profile with metadata", async () => {
                    const createResponse = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Profile",
                            type: "default",
                        },
                        seller1Headers
                    )

                    const profileId = createResponse.data.shipping_profile.id

                    const response = await api.post(
                        `/vendor/shipping-profiles/${profileId}`,
                        {
                            metadata: {
                                custom_field: "custom_value",
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                })

                it("should not allow seller to update another seller's shipping profile", async () => {
                    const createResponse = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Seller 1 Profile",
                            type: "default",
                        },
                        seller1Headers
                    )

                    const profileId = createResponse.data.shipping_profile.id

                    const response = await api
                        .post(
                            `/vendor/shipping-profiles/${profileId}`,
                            { name: "Hacked Name" },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/shipping-profiles/:id", () => {
                it("should delete seller's own shipping profile", async () => {
                    const createResponse = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Profile to Delete",
                            type: "default",
                        },
                        seller1Headers
                    )

                    const profileId = createResponse.data.shipping_profile.id

                    const response = await api.delete(
                        `/vendor/shipping-profiles/${profileId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: profileId,
                        object: "shipping_profile",
                        deleted: true,
                    })

                    const getResponse = await api
                        .get(`/vendor/shipping-profiles/${profileId}`, seller1Headers)
                        .catch((e) => e.response)

                    expect(getResponse.status).toEqual(404)
                })

                it("should not allow seller to delete another seller's shipping profile", async () => {
                    const createResponse = await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: "Seller 1 Profile",
                            type: "default",
                        },
                        seller1Headers
                    )

                    const profileId = createResponse.data.shipping_profile.id

                    const response = await api
                        .delete(`/vendor/shipping-profiles/${profileId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)

                    const getResponse = await api.get(
                        `/vendor/shipping-profiles/${profileId}`,
                        seller1Headers
                    )

                    expect(getResponse.status).toEqual(200)
                })
            })
        })
    },
})
