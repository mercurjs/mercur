import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Shipping Profiles", () => {
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

            describe("GET /vendor/shipping-profiles", () => {
                it("should list every operator-defined shipping profile", async () => {
                    await createShippingProfile(appContainer, {
                        name: "Standard",
                    })
                    await createShippingProfile(appContainer, {
                        name: "Express",
                        type: "express",
                    })

                    const response = await api.get(
                        `/vendor/shipping-profiles`,
                        seller1Headers
                    )

                    expect(response.status).toBe(200)
                    expect(
                        response.data.shipping_profiles.map((p: any) => p.name)
                    ).toEqual(expect.arrayContaining(["Standard", "Express"]))
                })

                it("should return the same profiles to every seller", async () => {
                    await createShippingProfile(appContainer, {
                        name: "Shared Profile",
                    })

                    const seller1Response = await api.get(
                        `/vendor/shipping-profiles`,
                        seller1Headers
                    )
                    const seller2Response = await api.get(
                        `/vendor/shipping-profiles`,
                        seller2Headers
                    )

                    expect(
                        seller1Response.data.shipping_profiles.map(
                            (p: any) => p.id
                        )
                    ).toEqual(
                        seller2Response.data.shipping_profiles.map(
                            (p: any) => p.id
                        )
                    )
                })

                it("should filter by type", async () => {
                    await createShippingProfile(appContainer, {
                        name: "Default Profile",
                    })
                    await createShippingProfile(appContainer, {
                        name: "Express Profile",
                        type: "express",
                    })

                    const response = await api.get(
                        `/vendor/shipping-profiles?type=express`,
                        seller1Headers
                    )

                    expect(response.status).toBe(200)
                    expect(response.data.shipping_profiles).toHaveLength(1)
                    expect(response.data.shipping_profiles[0].name).toBe(
                        "Express Profile"
                    )
                })
            })

            describe("GET /vendor/shipping-profiles/:id", () => {
                it("should retrieve a shipping profile", async () => {
                    const profile = await createShippingProfile(appContainer, {
                        name: "Retrievable",
                    })

                    const response = await api.get(
                        `/vendor/shipping-profiles/${profile.id}`,
                        seller1Headers
                    )

                    expect(response.status).toBe(200)
                    expect(response.data.shipping_profile).toEqual(
                        expect.objectContaining({
                            id: profile.id,
                            name: "Retrievable",
                        })
                    )
                })

                it("should return 404 for an unknown profile", async () => {
                    const error = await api
                        .get(`/vendor/shipping-profiles/sp_missing`, seller1Headers)
                        .catch((e: any) => e)

                    expect(error.response.status).toBe(404)
                })
            })

            describe("write access", () => {
                it("should not expose create, update or delete endpoints", async () => {
                    const profile = await createShippingProfile(appContainer, {
                        name: "Read Only",
                    })

                    const createError = await api
                        .post(
                            `/vendor/shipping-profiles`,
                            { name: "Vendor Profile", type: "default" },
                            seller1Headers
                        )
                        .catch((e: any) => e)
                    const updateError = await api
                        .post(
                            `/vendor/shipping-profiles/${profile.id}`,
                            { name: "Renamed" },
                            seller1Headers
                        )
                        .catch((e: any) => e)
                    const deleteError = await api
                        .delete(
                            `/vendor/shipping-profiles/${profile.id}`,
                            seller1Headers
                        )
                        .catch((e: any) => e)

                    expect(createError.response.status).toBe(404)
                    expect(updateError.response.status).toBe(404)
                    expect(deleteError.response.status).toBe(404)
                })
            })
        })
    },
})
