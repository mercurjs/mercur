import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IFulfillmentModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Shipping Option Types", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: any
            let fulfillmentModuleService: IFulfillmentModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                fulfillmentModuleService = appContainer.resolve(Modules.FULFILLMENT)
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer, {
                    email: "seller@test.com",
                    name: "Test Seller",
                })
                sellerHeaders = result.headers
            })

            describe("GET /vendor/shipping-option-types", () => {
                it("should list shipping option types", async () => {
                    await fulfillmentModuleService.createShippingOptionTypes([
                        { label: "Standard Shipping", code: "standard", description: "Standard delivery" },
                        { label: "Express Shipping", code: "express", description: "Fast delivery" },
                    ])

                    const response = await api.get(
                        `/vendor/shipping-option-types`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_option_types).toBeDefined()
                    expect(response.data.shipping_option_types.length).toBeGreaterThanOrEqual(2)

                    const labels = response.data.shipping_option_types.map((t: any) => t.label)
                    expect(labels).toContain("Standard Shipping")
                    expect(labels).toContain("Express Shipping")
                })

                it("should filter shipping option types by label", async () => {
                    await fulfillmentModuleService.createShippingOptionTypes([
                        { label: "unique-label-123", code: "unique-123", description: "Unique type" },
                    ])

                    const response = await api.get(
                        `/vendor/shipping-option-types?label=unique-label-123`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_option_types).toHaveLength(1)
                    expect(response.data.shipping_option_types[0].label).toEqual("unique-label-123")
                })

                it("should filter shipping option types by code", async () => {
                    await fulfillmentModuleService.createShippingOptionTypes([
                        { label: "Code Filter Test", code: "code-filter-test", description: "Test" },
                    ])

                    const response = await api.get(
                        `/vendor/shipping-option-types?code=code-filter-test`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_option_types).toHaveLength(1)
                    expect(response.data.shipping_option_types[0].code).toEqual("code-filter-test")
                })

                it("should search shipping option types with q parameter", async () => {
                    await fulfillmentModuleService.createShippingOptionTypes([
                        { label: "Searchable Type", code: "searchable", description: "For search test" },
                    ])

                    const response = await api.get(
                        `/vendor/shipping-option-types?q=searchable`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_option_types.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.shipping_option_types.some(
                            (t: any) => t.label.toLowerCase().includes("searchable") || t.code.includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await fulfillmentModuleService.createShippingOptionTypes([
                        { label: "Type A", code: "type-a", description: "A" },
                        { label: "Type B", code: "type-b", description: "B" },
                        { label: "Type C", code: "type-c", description: "C" },
                    ])

                    const response = await api.get(
                        `/vendor/shipping-option-types?limit=2&offset=0`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_option_types.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/shipping-option-types/:id", () => {
                it("should get a shipping option type by id", async () => {
                    const [shippingOptionType] = await fulfillmentModuleService.createShippingOptionTypes([
                        { label: "Get By Id Type", code: "get-by-id", description: "Test description" },
                    ])

                    const response = await api.get(
                        `/vendor/shipping-option-types/${shippingOptionType.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.shipping_option_type).toBeDefined()
                    expect(response.data.shipping_option_type.id).toEqual(shippingOptionType.id)
                    expect(response.data.shipping_option_type.label).toEqual("Get By Id Type")
                    expect(response.data.shipping_option_type.code).toEqual("get-by-id")
                })

                it("should return 404 for non-existent shipping option type", async () => {
                    const response = await api
                        .get(`/vendor/shipping-option-types/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
