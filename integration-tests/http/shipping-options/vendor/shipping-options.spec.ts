import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IFulfillmentModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Shipping Options", () => {
            let appContainer: MedusaContainer
            let seller1: any
            let seller1Headers: any
            let seller2: any
            let seller2Headers: any
            let fulfillmentModuleService: IFulfillmentModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                fulfillmentModuleService = appContainer.resolve(Modules.FULFILLMENT)
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

            let prerequisiteCounter = 0

            const createShippingPrerequisites = async (headers: any) => {
                const uniqueSuffix = `_${Date.now()}_${++prerequisiteCounter}`

                const locationResponse = await api.post(
                    `/vendor/stock-locations`,
                    { name: `Test Warehouse${uniqueSuffix}` },
                    headers
                )
                const stockLocation = locationResponse.data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `Test Fulfillment Set${uniqueSuffix}`,
                        type: "shipping",
                    },
                    headers
                )

                const updatedLocation = await api.get(
                    `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
                    headers
                )
                const fulfillmentSet = updatedLocation.data.stock_location.fulfillment_sets[0]

                const serviceZoneResponse = await api.post(
                    `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                    {
                        name: `Test Service Zone${uniqueSuffix}`,
                        geo_zones: [
                            {
                                type: "country",
                                country_code: "us",
                            },
                        ],
                    },
                    headers
                )

                const serviceZone = serviceZoneResponse.data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `Test Service Zone${uniqueSuffix}`
                )

                const shippingProfileResponse = await api.post(
                    `/vendor/shipping-profiles`,
                    {
                        name: `Test Shipping Profile${uniqueSuffix}`,
                        type: "default",
                    },
                    headers
                )
                const shippingProfile = shippingProfileResponse.data.shipping_profile

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
                    {
                        add: ["manual_manual"],
                    },
                    headers
                )

                return {
                    stockLocation,
                    fulfillmentSet,
                    serviceZone,
                    shippingProfile,
                }
            }

            const createShippingOption = async (
                headers: any,
                prerequisites: {
                    serviceZone: any
                    shippingProfile: any
                },
                overrides: Record<string, any> = {}
            ) => {
                const response = await api.post(
                    `/vendor/shipping-options`,
                    {
                        name: "Test Shipping Option",
                        service_zone_id: prerequisites.serviceZone.id,
                        shipping_profile_id: prerequisites.shippingProfile.id,
                        provider_id: "manual_manual",
                        price_type: "flat",
                        type: {
                            label: "Standard",
                            description: "Standard shipping",
                            code: "standard",
                        },
                        prices: [
                            {
                                currency_code: "usd",
                                amount: 1000,
                            },
                        ],
                        ...overrides,
                    },
                    headers
                )
                return response.data.shipping_option
            }

            describe("POST /vendor/shipping-options", () => {
                it("should create a shipping option with flat price", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const response = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Standard Shipping",
                            service_zone_id: prerequisites.serviceZone.id,
                            shipping_profile_id: prerequisites.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Standard",
                                description: "Standard delivery in 3-5 days",
                                code: "standard",
                            },
                            prices: [
                                {
                                    currency_code: "usd",
                                    amount: 1000,
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.shipping_option).toBeDefined()
                    expect(response.data.shipping_option.name).toEqual("Standard Shipping")
                    expect(response.data.shipping_option.price_type).toEqual("flat")
                })

                it("should fail to create a shipping option with calculated price when provider doesn't support it", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const response = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Calculated Shipping",
                            service_zone_id: prerequisites.serviceZone.id,
                            shipping_profile_id: prerequisites.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "calculated",
                            type: {
                                label: "Calculated",
                                description: "Price calculated at checkout",
                                code: "calculated",
                            },
                            prices: [
                                {
                                    currency_code: "usd",
                                    amount: 0,
                                },
                            ],
                        },
                        seller1Headers
                    ).catch((e) => e.response)

                    // manual_manual provider doesn't support calculated pricing
                    expect(response.status).toEqual(400)
                })

                it("should create a shipping option with multiple prices", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const response = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Multi-Price Shipping",
                            service_zone_id: prerequisites.serviceZone.id,
                            shipping_profile_id: prerequisites.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Multi",
                                description: "Multiple currency support",
                                code: "multi",
                            },
                            prices: [
                                {
                                    currency_code: "usd",
                                    amount: 1000,
                                },
                                {
                                    currency_code: "eur",
                                    amount: 900,
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.shipping_option).toBeDefined()
                })

                it("should create a shipping option with rules", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const response = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Rule-Based Shipping",
                            service_zone_id: prerequisites.serviceZone.id,
                            shipping_profile_id: prerequisites.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Rules",
                                description: "With rules",
                                code: "rules",
                            },
                            prices: [
                                {
                                    currency_code: "usd",
                                    amount: 1500,
                                },
                            ],
                            rules: [
                                {
                                    attribute: "enabled_in_store",
                                    value: "true",
                                    operator: "eq",
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.shipping_option).toBeDefined()
                })

                it("should create a shipping option with existing type_id", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const [shippingOptionType] = await fulfillmentModuleService.createShippingOptionTypes([
                        { label: "Existing Type", code: "existing-type", description: "Pre-existing type" },
                    ])

                    const response = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Existing Type Shipping",
                            service_zone_id: prerequisites.serviceZone.id,
                            shipping_profile_id: prerequisites.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type_id: shippingOptionType.id,
                            prices: [
                                {
                                    currency_code: "usd",
                                    amount: 1000,
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.shipping_option).toBeDefined()
                })

                it("should create a shipping option with metadata", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const response = await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: "Metadata Shipping",
                            service_zone_id: prerequisites.serviceZone.id,
                            shipping_profile_id: prerequisites.shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Metadata",
                                description: "With metadata",
                                code: "metadata",
                            },
                            prices: [
                                {
                                    currency_code: "usd",
                                    amount: 1000,
                                },
                            ],
                            metadata: {
                                custom_field: "custom_value",
                                delivery_days: 5,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(201)
                    expect(response.data.shipping_option).toBeDefined()
                })

                it("should fail to create shipping option without name", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const response = await api
                        .post(
                            `/vendor/shipping-options`,
                            {
                                service_zone_id: prerequisites.serviceZone.id,
                                shipping_profile_id: prerequisites.shippingProfile.id,
                                provider_id: "manual_manual",
                                price_type: "flat",
                                type: {
                                    label: "No Name",
                                    description: "Missing name",
                                    code: "no-name",
                                },
                                prices: [
                                    {
                                        currency_code: "usd",
                                        amount: 1000,
                                    },
                                ],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should fail to create shipping option without prices", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const response = await api
                        .post(
                            `/vendor/shipping-options`,
                            {
                                name: "No Prices Shipping",
                                service_zone_id: prerequisites.serviceZone.id,
                                shipping_profile_id: prerequisites.shippingProfile.id,
                                provider_id: "manual_manual",
                                price_type: "flat",
                                type: {
                                    label: "No Prices",
                                    description: "Missing prices",
                                    code: "no-prices",
                                },
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should fail to create shipping option with both type and type_id", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    const [shippingOptionType] = await fulfillmentModuleService.createShippingOptionTypes([
                        { label: "Both Type", code: "both-type", description: "Test" },
                    ])

                    const response = await api
                        .post(
                            `/vendor/shipping-options`,
                            {
                                name: "Both Type Shipping",
                                service_zone_id: prerequisites.serviceZone.id,
                                shipping_profile_id: prerequisites.shippingProfile.id,
                                provider_id: "manual_manual",
                                price_type: "flat",
                                type: {
                                    label: "Type Object",
                                    description: "Type object",
                                    code: "type-object",
                                },
                                type_id: shippingOptionType.id,
                                prices: [
                                    {
                                        currency_code: "usd",
                                        amount: 1000,
                                    },
                                ],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })
            })

            describe("GET /vendor/shipping-options", () => {
                it("should list shipping options", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    await createShippingOption(seller1Headers, prerequisites, { name: "Shipping A" })
                    await createShippingOption(seller1Headers, prerequisites, {
                        name: "Shipping B",
                        type: { label: "Type B", description: "B", code: "type-b" },
                    })

                    const response = await api.get(`/vendor/shipping-options`, seller1Headers)

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_options).toBeDefined()
                    expect(response.data.shipping_options.length).toBeGreaterThanOrEqual(2)
                })

                it("should filter shipping options by service_zone_id", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)

                    await createShippingOption(seller1Headers, prerequisites)

                    const response = await api.get(
                        `/vendor/shipping-options?service_zone_id=${prerequisites.serviceZone.id}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_options.length).toBeGreaterThanOrEqual(1)
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
                        type: { label: "Pagination B", description: "B", code: "pagination-b" },
                    })
                    await createShippingOption(seller1Headers, prerequisites, {
                        name: "Pagination C",
                        type: { label: "Pagination C", description: "C", code: "pagination-c" },
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
                        response1.data.shipping_options.some((so: any) => so.id === shippingOption1.id)
                    ).toBe(true)
                    expect(
                        response2.data.shipping_options.some((so: any) => so.id === shippingOption1.id)
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

                it("should fail to update shipping option to calculated price_type when provider doesn't support it", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

                    const response = await api.post(
                        `/vendor/shipping-options/${shippingOption.id}`,
                        { price_type: "calculated" },
                        seller1Headers
                    ).catch((e) => e.response)

                    // manual_manual provider doesn't support calculated pricing
                    expect(response.status).toEqual(400)
                })

                it("should update shipping option prices", async () => {
                    const prerequisites = await createShippingPrerequisites(seller1Headers)
                    const shippingOption = await createShippingOption(seller1Headers, prerequisites)

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
