import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { linkSellerCurrencyRegions } from "../../../helpers/link-seller-regions"
import {
    createScopedAdminHeaders,
    createShippingRuleAndEnable,
} from "../../../helpers/shipping-rules"

jest.setTimeout(120000)

type Headers = { headers: Record<string, string> }

type Prerequisites = {
    stockLocation: { id: string }
    shippingProfile: { id: string }
}

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Shipping Options", () => {
            let appContainer: MedusaContainer
            let seller1Headers: Headers
            let seller2Headers: Headers

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const result1 = await createSellerUser(appContainer, {
                    email: "seller1@test.com",
                    name: "Seller One",
                })
                seller1Headers = result1.headers
                await linkSellerCurrencyRegions(appContainer, result1.seller.id, [
                    "eur",
                ])

                const result2 = await createSellerUser(appContainer, {
                    email: "seller2@test.com",
                    name: "Seller Two",
                })
                seller2Headers = result2.headers
            })

            let prerequisiteCounter = 0

            const createShippingPrerequisites = async (
                headers: Headers
            ): Promise<Prerequisites> => {
                const uniqueSuffix = `_${Date.now()}_${++prerequisiteCounter}`

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `Test Warehouse${uniqueSuffix}` },
                        headers
                    )
                ).data.stock_location

                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `Test Shipping Profile${uniqueSuffix}`,
                })

                return { stockLocation, shippingProfile }
            }

            const createShippingOption = async (
                headers: Headers,
                prerequisites: Prerequisites,
                overrides: { name?: string; sellerCanEditPrice?: boolean } = {}
            ) => {
                const { shippingOption } = await createShippingRuleAndEnable(api, {
                    adminHeaders: await createScopedAdminHeaders(appContainer),
                    sellerHeaders: headers,
                    stockLocationId: prerequisites.stockLocation.id,
                    shippingProfileId: prerequisites.shippingProfile.id,
                    countryCodes: ["us"],
                    prices: [{ currency_code: "usd", amount: 1000 }],
                    sellerCanEditPrice: overrides.sellerCanEditPrice,
                })

                if (overrides.name) {
                    await api.post(
                        `/vendor/shipping-options/${shippingOption.id}`,
                        { name: overrides.name },
                        headers
                    )
                }

                return shippingOption
            }

            describe("POST /vendor/shipping-options", () => {
                it("rejects seller-created shipping options", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const existing = await createShippingOption(seller1Headers, prerequisites)
                    const { data: { shipping_option: option } } = await api.get(
                        `/vendor/shipping-options/${existing.id}`,
                        seller1Headers
                    )

                    const response = await api
                        .post(
                            `/vendor/shipping-options`,
                            {
                                name: "Standard Shipping",
                                service_zone_id: option.service_zone.id,
                                shipping_profile_id: prerequisites.shippingProfile.id,
                                provider_id: "manual_manual",
                                price_type: "flat",
                                type: {
                                    label: "Standard",
                                    description: "Standard delivery in 3-5 days",
                                    code: "standard",
                                },
                                prices: [{ currency_code: "usd", amount: 1000 }],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                    expect(response.data.message).toContain("/vendor/shipping-rules/:id/enable")

                    const listed = await api.get(`/vendor/shipping-options`, seller1Headers)
                    expect(listed.data.shipping_options).toHaveLength(1)
                })
            })

            describe("GET /vendor/shipping-options", () => {
                it("should list shipping options", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    await createShippingOption(seller1Headers, prerequisites, { name: "Shipping A" })
                    await createShippingOption(seller1Headers, prerequisites, {
                        name: "Shipping B",
                    })

                    const response = await api.get(`/vendor/shipping-options`, seller1Headers)

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_options).toBeDefined()
                    expect(response.data.shipping_options.length).toBeGreaterThanOrEqual(2)
                })

                it("should filter shipping options by service_zone_id", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)
                    await createShippingOption(seller1Headers, prerequisites)
                    const serviceZoneId = (
                        await api.get(
                            `/vendor/shipping-options/${shippingOption.id}`,
                            seller1Headers
                        )
                    ).data.shipping_option.service_zone.id

                    const response = await api.get(
                        `/vendor/shipping-options?service_zone_id=${serviceZoneId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(
                        response.data.shipping_options.map((so: { id: string }) => so.id)
                    ).toEqual([shippingOption.id])
                })

                it("should filter shipping options by shipping_profile_id", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    await createShippingOption(seller1Headers, prerequisites)

                    const response = await api.get(
                        `/vendor/shipping-options?shipping_profile_id=${prerequisites.shippingProfile.id}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_options.length).toBeGreaterThanOrEqual(1)
                })

                it("should support pagination", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    await createShippingOption(seller1Headers, prerequisites, { name: "Pagination A" })
                    await createShippingOption(seller1Headers, prerequisites, {
                        name: "Pagination B",
                    })
                    await createShippingOption(seller1Headers, prerequisites, {
                        name: "Pagination C",
                    })

                    const response = await api.get(
                        `/vendor/shipping-options?limit=2&offset=0`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_options.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })

                it("should not list another seller's shipping options", async () => {
                    const prerequisites1 = await createShippingPrerequisites(seller1Headers)
                    const prerequisites2 = await createShippingPrerequisites(seller2Headers)

                    const shippingOption1 = await createShippingOption(seller1Headers, prerequisites1, {
                        name: "Seller 1 Shipping",
                    })

                    await createShippingOption(seller2Headers, prerequisites2, {
                        name: "Seller 2 Shipping",
                    })

                    const response1 = await api.get(`/vendor/shipping-options`, seller1Headers)
                    const response2 = await api.get(`/vendor/shipping-options`, seller2Headers)

                    expect(
                        response1.data.shipping_options.some((so: { id: string }) => so.id === shippingOption1.id)
                    ).toBe(true)
                    expect(
                        response2.data.shipping_options.some((so: { id: string }) => so.id === shippingOption1.id)
                    ).toBe(false)
                })
            })

            describe("GET /vendor/shipping-options/:id", () => {
                it("should get seller's own shipping option", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api.get(
                        `/vendor/shipping-options/${shippingOption.id}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_option).toBeDefined()
                    expect(response.data.shipping_option.id).toEqual(shippingOption.id)
                })

                it("should not allow seller to get another seller's shipping option", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api
                        .get(`/vendor/shipping-options/${shippingOption.id}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent shipping option", async () => {
                    const response = await api
                        .get(`/vendor/shipping-options/non-existent-id`, seller1Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/shipping-options/:id", () => {
                it("should update shipping option name", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites, {
                        name: "Original Name",
                    })

                    const response = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}`,
                        { name: "Updated Name" },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_option.name).toEqual("Updated Name")
                })

                it.each([
                    ["price_type", { price_type: "calculated" }],
                    ["provider_id", { provider_id: "manual_manual" }],
                    ["type_id", { type_id: "sotype_123" }],
                    ["type", { type: { label: "Express", code: "express" } }],
                ])(
                    "rejects a seller update of the marketplace-managed %s",
                    async (_field, body) => {
                        const prerequisites = await createShippingPrerequisites(seller1Headers)
                        const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                        const response = await api
                            .post(
                                `/vendor/shipping-options/${shippingOption.id}`,
                                body,
                                seller1Headers
                            )
                            .catch((e) => e.response)

                        expect(response.status).toEqual(400)
                    }
                )

                it("rejects a seller update of the shipping profile", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)
                    const otherProfile = await createShippingProfile(appContainer, {
                        name: `Other Profile ${Date.now()}`,
                    })

                    const response = await api
                        .post(
                            `/vendor/shipping-options/${shippingOption.id}`,
                            { shipping_profile_id: otherProfile.id },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should update shipping option prices when the rule allows it", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites, {
                        sellerCanEditPrice: true,
                    })

                    const response = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}`,
                        {
                            prices: [
                                {
                                    currency_code: "usd",
                                    amount: 2000,
                                },
                                {
                                    currency_code: "eur",
                                    amount: 1800,
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_option.prices).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({ currency_code: "usd", amount: 2000 }),
                            expect.objectContaining({ currency_code: "eur", amount: 1800 }),
                        ])
                    )
                })

                it("rejects a price update when the marketplace sets the price", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api
                        .post(
                            `/vendor/shipping-options/${shippingOption.id}`,
                            { prices: [{ currency_code: "usd", amount: 2000 }] },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should update shipping option metadata", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}`,
                        {
                            metadata: {
                                updated_field: "updated_value",
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                })

                it("should not allow seller to update another seller's shipping option", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api
                        .post(
                            `/vendor/shipping-options/${shippingOption.id}`,
                            { name: "Hacked Name" },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent shipping option", async () => {
                    const response = await api
                        .post(
                            `/vendor/shipping-options/non-existent-id`,
                            { name: "Updated" },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/shipping-options/:id", () => {
                it("should delete seller's own shipping option", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api.delete(
                        `/vendor/shipping-options/${shippingOption.id}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: shippingOption.id,
                        object: "shipping_option",
                        deleted: true,
                    })

                    const getResponse = await api
                        .get(`/vendor/shipping-options/${shippingOption.id}`, seller1Headers)
                        .catch((e) => e.response)

                    expect(getResponse.status).toEqual(404)
                })

                it("should not allow seller to delete another seller's shipping option", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api
                        .delete(`/vendor/shipping-options/${shippingOption.id}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)

                    const getResponse = await api.get(
                        `/vendor/shipping-options/${shippingOption.id}`,
                        seller1Headers
                    )

                    expect(getResponse.status).toEqual(200)
                })

                it("should return 404 for non-existent shipping option", async () => {
                    const response = await api
                        .delete(`/vendor/shipping-options/non-existent-id`, seller1Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("POST /vendor/shipping-options/:id/rules/batch", () => {
                it("should create rules for shipping option", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}/rules/batch`,
                        {
                            create: [
                                {
                                    attribute: "enabled_in_store",
                                    value: "true",
                                    operator: "eq",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.created).toBeDefined()
                    expect(response.data.created.length).toEqual(1)
                })

                it("should update existing rules", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    // First create a rule via batch
                    const createRuleResponse = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}/rules/batch`,
                        {
                            create: [
                                {
                                    attribute: "enabled_in_store",
                                    value: "true",
                                    operator: "eq",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const ruleId = createRuleResponse.data.created[0].id

                    const response = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}/rules/batch`,
                        {
                            update: [
                                {
                                    id: ruleId,
                                    attribute: "enabled_in_store",
                                    value: "false",
                                    operator: "eq",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.updated).toBeDefined()
                    expect(response.data.updated.length).toEqual(1)
                })

                it("should delete rules", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    // First create a rule via batch
                    const createRuleResponse = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}/rules/batch`,
                        {
                            create: [
                                {
                                    attribute: "enabled_in_store",
                                    value: "true",
                                    operator: "eq",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const ruleId = createRuleResponse.data.created[0].id

                    const response = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}/rules/batch`,
                        {
                            delete: [ruleId],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.deleted).toBeDefined()
                    expect(response.data.deleted.ids).toContain(ruleId)
                })

                it("should perform batch operations (create, update, delete)", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    // First create some rules via batch
                    const createRulesResponse = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}/rules/batch`,
                        {
                            create: [
                                {
                                    attribute: "enabled_in_store",
                                    value: "true",
                                    operator: "eq",
                                },
                                {
                                    attribute: "is_return",
                                    value: "false",
                                    operator: "eq",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const rules = createRulesResponse.data.created
                    const ruleToUpdate = rules[0]
                    const ruleToDelete = rules[1]

                    const response = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}/rules/batch`,
                        {
                            create: [
                                {
                                    attribute: "customer_group",
                                    value: "vip",
                                    operator: "eq",
                                },
                            ],
                            update: [
                                {
                                    id: ruleToUpdate.id,
                                    attribute: "enabled_in_store",
                                    value: "false",
                                    operator: "eq",
                                },
                            ],
                            delete: [ruleToDelete.id],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.created.length).toEqual(1)
                    expect(response.data.updated.length).toEqual(1)
                    expect(response.data.deleted.ids).toContain(ruleToDelete.id)
                })

                it("should not allow seller to batch update another seller's shipping option rules", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api
                        .post(
                            `/vendor/shipping-options/${shippingOption.id}/rules/batch`,
                            {
                                create: [
                                    {
                                        attribute: "enabled_in_store",
                                        value: "true",
                                        operator: "eq",
                                    },
                                ],
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent shipping option", async () => {
                    const response = await api
                        .post(
                            `/vendor/shipping-options/non-existent-id/rules/batch`,
                            {
                                create: [
                                    {
                                        attribute: "enabled_in_store",
                                        value: "true",
                                        operator: "eq",
                                    },
                                ],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
