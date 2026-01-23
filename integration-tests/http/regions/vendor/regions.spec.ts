import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IRegionModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Regions", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: any
            let regionModuleService: IRegionModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                regionModuleService = appContainer.resolve(Modules.REGION)
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer, {
                    email: "seller@test.com",
                    name: "Test Seller",
                })
                sellerHeaders = result.headers
            })

            describe("GET /vendor/regions", () => {
                it("should list regions", async () => {
                    await regionModuleService.createRegions([
                        { name: "United States", currency_code: "usd", countries: ["us"] },
                        { name: "Europe", currency_code: "eur", countries: ["de", "fr"] },
                    ])

                    const response = await api.get(
                        `/vendor/regions`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.regions).toBeDefined()
                    expect(response.data.regions.length).toBeGreaterThanOrEqual(2)

                    const names = response.data.regions.map((r: any) => r.name)
                    expect(names).toContain("United States")
                    expect(names).toContain("Europe")
                })

                it("should filter regions by name", async () => {
                    await regionModuleService.createRegions([
                        { name: "unique-region-123", currency_code: "usd", countries: ["us"] },
                    ])

                    const response = await api.get(
                        `/vendor/regions?name=unique-region-123`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.regions).toHaveLength(1)
                    expect(response.data.regions[0].name).toEqual("unique-region-123")
                })

                it("should filter regions by currency_code", async () => {
                    await regionModuleService.createRegions([
                        { name: "GBP Region", currency_code: "gbp", countries: ["gb"] },
                    ])

                    const response = await api.get(
                        `/vendor/regions?currency_code=gbp`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.regions.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.regions.every((r: any) => r.currency_code === "gbp")
                    ).toBe(true)
                })

                it("should search regions with q parameter", async () => {
                    await regionModuleService.createRegions([
                        { name: "Searchable Region", currency_code: "usd", countries: ["us"] },
                    ])

                    const response = await api.get(
                        `/vendor/regions?q=searchable`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.regions.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.regions.some((r: any) =>
                            r.name.toLowerCase().includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await regionModuleService.createRegions([
                        { name: "Region A", currency_code: "usd", countries: ["us"] },
                        { name: "Region B", currency_code: "eur", countries: ["de"] },
                        { name: "Region C", currency_code: "gbp", countries: ["gb"] },
                    ])

                    const response = await api.get(
                        `/vendor/regions?limit=2&offset=0`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.regions.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/regions/:id", () => {
                it("should get a region by id", async () => {
                    const [region] = await regionModuleService.createRegions([
                        { name: "Get By Id Region", currency_code: "usd", countries: ["us"] },
                    ])

                    const response = await api.get(
                        `/vendor/regions/${region.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.region).toBeDefined()
                    expect(response.data.region.id).toEqual(region.id)
                    expect(response.data.region.name).toEqual("Get By Id Region")
                    expect(response.data.region.currency_code).toEqual("usd")
                })

                it("should return 404 for non-existent region", async () => {
                    const response = await api
                        .get(`/vendor/regions/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
