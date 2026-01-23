import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IPricingModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Price Preferences", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: any
            let pricingModuleService: IPricingModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                pricingModuleService = appContainer.resolve(Modules.PRICING)
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer, {
                    email: "seller@test.com",
                    name: "Test Seller",
                })
                sellerHeaders = result.headers
            })

            describe("GET /vendor/price-preferences", () => {
                it("should list price preferences", async () => {
                    await pricingModuleService.createPricePreferences([
                        { attribute: "region_id", value: "reg_us", is_tax_inclusive: true },
                        { attribute: "region_id", value: "reg_eu", is_tax_inclusive: false },
                    ])

                    const response = await api.get(
                        `/vendor/price-preferences`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_preferences).toBeDefined()
                    expect(response.data.price_preferences.length).toBeGreaterThanOrEqual(2)
                })

                it("should filter price preferences by id", async () => {
                    const [pricePreference] = await pricingModuleService.createPricePreferences([
                        { attribute: "filter_id_attr", value: "filter_id_val", is_tax_inclusive: true },
                    ])

                    const response = await api.get(
                        `/vendor/price-preferences?id=${pricePreference.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_preferences).toHaveLength(1)
                    expect(response.data.price_preferences[0].id).toEqual(pricePreference.id)
                })

                it("should filter price preferences by attribute", async () => {
                    await pricingModuleService.createPricePreferences([
                        { attribute: "unique_attr_test", value: "test_value", is_tax_inclusive: true },
                    ])

                    const response = await api.get(
                        `/vendor/price-preferences?attribute=unique_attr_test`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_preferences.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.price_preferences.every((p: any) => p.attribute === "unique_attr_test")
                    ).toBe(true)
                })

                it("should filter price preferences by value", async () => {
                    await pricingModuleService.createPricePreferences([
                        { attribute: "region_id", value: "unique_value_123", is_tax_inclusive: false },
                    ])

                    const response = await api.get(
                        `/vendor/price-preferences?value=unique_value_123`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_preferences.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.price_preferences.every((p: any) => p.value === "unique_value_123")
                    ).toBe(true)
                })

                it("should filter price preferences by multiple ids", async () => {
                    const pricePreferences = await pricingModuleService.createPricePreferences([
                        { attribute: "region_id", value: "multi_1", is_tax_inclusive: true },
                        { attribute: "region_id", value: "multi_2", is_tax_inclusive: false },
                    ])

                    const response = await api.get(
                        `/vendor/price-preferences?id[]=${pricePreferences[0].id}&id[]=${pricePreferences[1].id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_preferences.length).toBeGreaterThanOrEqual(2)

                    const ids = response.data.price_preferences.map((p: any) => p.id)
                    expect(ids).toContain(pricePreferences[0].id)
                    expect(ids).toContain(pricePreferences[1].id)
                })

                it("should support pagination", async () => {
                    await pricingModuleService.createPricePreferences([
                        { attribute: "region_id", value: "page_1", is_tax_inclusive: true },
                        { attribute: "region_id", value: "page_2", is_tax_inclusive: false },
                        { attribute: "region_id", value: "page_3", is_tax_inclusive: true },
                    ])

                    const response = await api.get(
                        `/vendor/price-preferences?limit=2&offset=0`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_preferences.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })

                it("should return price preference fields correctly", async () => {
                    const [created] = await pricingModuleService.createPricePreferences([
                        { attribute: "fields_test_attr", value: "fields_test_val", is_tax_inclusive: true },
                    ])

                    const response = await api.get(
                        `/vendor/price-preferences?id=${created.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_preferences).toHaveLength(1)

                    const pricePreference = response.data.price_preferences[0]
                    expect(pricePreference.id).toEqual(created.id)
                    expect(pricePreference.attribute).toEqual("fields_test_attr")
                    expect(pricePreference.value).toEqual("fields_test_val")
                    expect(pricePreference.is_tax_inclusive).toEqual(true)
                    expect(pricePreference.created_at).toBeDefined()
                    expect(pricePreference.updated_at).toBeDefined()
                })
            })

            describe("GET /vendor/price-preferences/:id", () => {
                it("should get a price preference by id", async () => {
                    const [pricePreference] = await pricingModuleService.createPricePreferences([
                        { attribute: "region_id", value: "reg_single", is_tax_inclusive: true },
                    ])

                    const response = await api.get(
                        `/vendor/price-preferences/${pricePreference.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_preference).toBeDefined()
                    expect(response.data.price_preference.id).toEqual(pricePreference.id)
                    expect(response.data.price_preference.attribute).toEqual("region_id")
                    expect(response.data.price_preference.value).toEqual("reg_single")
                    expect(response.data.price_preference.is_tax_inclusive).toEqual(true)
                })

                it("should return 404 for non-existent price preference", async () => {
                    const response = await api
                        .get(`/vendor/price-preferences/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return all expected fields for a price preference", async () => {
                    const [pricePreference] = await pricingModuleService.createPricePreferences([
                        { attribute: "all_fields_attr", value: "all_fields_val", is_tax_inclusive: false },
                    ])

                    const response = await api.get(
                        `/vendor/price-preferences/${pricePreference.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.price_preference).toMatchObject({
                        id: pricePreference.id,
                        attribute: "all_fields_attr",
                        value: "all_fields_val",
                        is_tax_inclusive: false,
                    })
                    expect(response.data.price_preference.created_at).toBeDefined()
                    expect(response.data.price_preference.updated_at).toBeDefined()
                })
            })
        })
    },
})
