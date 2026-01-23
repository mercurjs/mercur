import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Promotions", () => {
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

            describe("POST /vendor/promotions", () => {
                it("should create a standard promotion with percentage discount", async () => {
                    const response = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "PROMO10",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion).toBeDefined()
                    expect(response.data.promotion.code).toEqual("PROMO10")
                    expect(response.data.promotion.type).toEqual("standard")
                    expect(response.data.promotion.application_method.type).toEqual("percentage")
                    expect(response.data.promotion.application_method.value).toEqual(10)
                })

                it("should create a standard promotion with fixed discount", async () => {
                    const response = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "FIXED20",
                            type: "standard",
                            application_method: {
                                type: "fixed",
                                target_type: "order",
                                value: 2000,
                                currency_code: "usd",
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.code).toEqual("FIXED20")
                    expect(response.data.promotion.application_method.type).toEqual("fixed")
                    expect(response.data.promotion.application_method.value).toEqual(2000)
                    expect(response.data.promotion.application_method.currency_code).toEqual("usd")
                })

                it("should create a promotion with draft status by default", async () => {
                    const response = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "DRAFT_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 5,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.status).toEqual("draft")
                })

                it("should create a promotion with active status", async () => {
                    const response = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "ACTIVE_PROMO",
                            type: "standard",
                            status: "active",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 15,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.status).toEqual("active")
                })

                it("should create an automatic promotion", async () => {
                    const response = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "AUTO_PROMO",
                            type: "standard",
                            is_automatic: true,
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.is_automatic).toEqual(true)
                })

                it("should create a promotion with max_quantity", async () => {
                    const response = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "MAX_QTY_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 20,
                                max_quantity: 5,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.application_method.max_quantity).toEqual(5)
                })

                it("should create a tax inclusive promotion", async () => {
                    const response = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "TAX_INCLUSIVE_PROMO",
                            type: "standard",
                            is_tax_inclusive: true,
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 15,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.is_tax_inclusive).toEqual(true)
                })

                it("should fail to create promotion without code", async () => {
                    const response = await api
                        .post(
                            `/vendor/promotions`,
                            {
                                type: "standard",
                                application_method: {
                                    type: "percentage",
                                    target_type: "order",
                                    value: 10,
                                },
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should fail to create promotion without application_method", async () => {
                    const response = await api
                        .post(
                            `/vendor/promotions`,
                            {
                                code: "NO_METHOD",
                                type: "standard",
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })
            })

            describe("GET /vendor/promotions", () => {
                it("should list promotions", async () => {
                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "LIST_PROMO_1",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "LIST_PROMO_2",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 20,
                            },
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/promotions`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotions).toBeDefined()
                    expect(response.data.promotions.length).toBeGreaterThanOrEqual(2)
                })

                it("should filter promotions by code", async () => {
                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "UNIQUE_CODE_123",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/promotions?code=UNIQUE_CODE_123`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotions.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.promotions.some((p: any) => p.code === "UNIQUE_CODE_123")
                    ).toBe(true)
                })

                it("should search promotions with q parameter", async () => {
                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SEARCHABLE_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/promotions?q=searchable`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotions.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.promotions.some((p: any) =>
                            p.code.toLowerCase().includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "PAGE_PROMO_A",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "PAGE_PROMO_B",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 15,
                            },
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "PAGE_PROMO_C",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 20,
                            },
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/promotions?limit=2&offset=0`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotions.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })

                it("should not list another seller's promotions", async () => {
                    await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER1_ONLY_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/promotions`,
                        seller2Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(
                        response.data.promotions.every((p: any) => p.code !== "SELLER1_ONLY_PROMO")
                    ).toBe(true)
                })
            })

            describe("GET /vendor/promotions/:id", () => {
                it("should get seller's own promotion", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "GET_BY_ID_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.get(
                        `/vendor/promotions/${promotionId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion).toBeDefined()
                    expect(response.data.promotion.id).toEqual(promotionId)
                    expect(response.data.promotion.code).toEqual("GET_BY_ID_PROMO")
                })

                it("should not allow seller to get another seller's promotion", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER1_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api
                        .get(`/vendor/promotions/${promotionId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent promotion", async () => {
                    const response = await api
                        .get(`/vendor/promotions/non-existent-id`, seller1Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return promotion with all expected fields", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "FULL_FIELDS_PROMO",
                            type: "standard",
                            is_automatic: true,
                            status: "active",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 25,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.get(
                        `/vendor/promotions/${promotionId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.id).toBeDefined()
                    expect(response.data.promotion.code).toEqual("FULL_FIELDS_PROMO")
                    expect(response.data.promotion.type).toEqual("standard")
                    expect(response.data.promotion.is_automatic).toEqual(true)
                    expect(response.data.promotion.status).toEqual("active")
                    expect(response.data.promotion.application_method).toBeDefined()
                    expect(response.data.promotion.created_at).toBeDefined()
                    expect(response.data.promotion.updated_at).toBeDefined()
                })
            })

            describe("POST /vendor/promotions/:id", () => {
                it("should update promotion code", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "ORIGINAL_CODE",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.post(
                        `/vendor/promotions/${promotionId}`,
                        {
                            code: "UPDATED_CODE",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.code).toEqual("UPDATED_CODE")
                })

                it("should update promotion status", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "STATUS_UPDATE_PROMO",
                            type: "standard",
                            status: "draft",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.post(
                        `/vendor/promotions/${promotionId}`,
                        {
                            status: "active",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.status).toEqual("active")
                })

                it("should update is_automatic flag", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "AUTO_UPDATE_PROMO",
                            type: "standard",
                            is_automatic: false,
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.post(
                        `/vendor/promotions/${promotionId}`,
                        {
                            is_automatic: true,
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.is_automatic).toEqual(true)
                })

                it("should update application method value", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "VALUE_UPDATE_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.post(
                        `/vendor/promotions/${promotionId}`,
                        {
                            application_method: {
                                value: 25,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.promotion.application_method.value).toEqual(25)
                })

                it("should not allow seller to update another seller's promotion", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER1_UPDATE_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api
                        .post(
                            `/vendor/promotions/${promotionId}`,
                            { code: "HACKED_CODE" },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/promotions/:id", () => {
                it("should delete seller's own promotion", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "DELETE_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.delete(
                        `/vendor/promotions/${promotionId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: promotionId,
                        object: "promotion",
                        deleted: true,
                    })

                    const getResponse = await api
                        .get(`/vendor/promotions/${promotionId}`, seller1Headers)
                        .catch((e) => e.response)

                    expect(getResponse.status).toEqual(404)
                })

                it("should not allow seller to delete another seller's promotion", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER1_DELETE_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api
                        .delete(`/vendor/promotions/${promotionId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)

                    const getResponse = await api.get(
                        `/vendor/promotions/${promotionId}`,
                        seller1Headers
                    )

                    expect(getResponse.status).toEqual(200)
                })
            })

            describe("POST /vendor/promotions/:id/rules/batch", () => {
                it("should add rules to promotion", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "RULES_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.post(
                        `/vendor/promotions/${promotionId}/rules/batch`,
                        {
                            create: [
                                {
                                    attribute: "currency_code",
                                    operator: "eq",
                                    values: ["usd"],
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.created).toBeDefined()
                    expect(response.data.created.length).toBeGreaterThanOrEqual(1)
                })

                it("should update rules on promotion", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "UPDATE_RULES_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                            rules: [
                                {
                                    attribute: "currency_code",
                                    operator: "eq",
                                    values: ["usd"],
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id
                    const ruleId = createResponse.data.promotion.rules[0].id

                    const response = await api.post(
                        `/vendor/promotions/${promotionId}/rules/batch`,
                        {
                            update: [
                                {
                                    id: ruleId,
                                    values: ["eur"],
                                },
                            ],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.updated).toBeDefined()
                })

                it("should delete rules from promotion", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "DELETE_RULES_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                            rules: [
                                {
                                    attribute: "currency_code",
                                    operator: "eq",
                                    values: ["usd"],
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id
                    const ruleId = createResponse.data.promotion.rules[0].id

                    const response = await api.post(
                        `/vendor/promotions/${promotionId}/rules/batch`,
                        {
                            delete: [ruleId],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.deleted).toBeDefined()
                    expect(response.data.deleted.deleted).toEqual(true)
                })

                it("should not allow seller to modify another seller's promotion rules", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER1_RULES_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api
                        .post(
                            `/vendor/promotions/${promotionId}/rules/batch`,
                            {
                                create: [
                                    {
                                        attribute: "currency_code",
                                        operator: "eq",
                                        values: ["usd"],
                                    },
                                ],
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("GET /vendor/promotions/:id/:rule_type", () => {
                it("should get promotion rules", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "GET_RULES_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                            rules: [
                                {
                                    attribute: "currency_code",
                                    operator: "eq",
                                    values: ["usd"],
                                },
                            ],
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.get(
                        `/vendor/promotions/${promotionId}/rules`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.rules).toBeDefined()
                })

                it("should return empty rules array for promotion without rules", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "NO_RULES_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api.get(
                        `/vendor/promotions/${promotionId}/rules`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.rules).toBeDefined()
                })

                it("should not allow seller to get another seller's promotion rules", async () => {
                    const createResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER1_GET_RULES_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = createResponse.data.promotion.id

                    const response = await api
                        .get(`/vendor/promotions/${promotionId}/rules`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
