import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IRegionModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { linkSellerRegions } from "../../../helpers/link-seller-regions"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Regions", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: any
            let sellerId: string
            let regionModuleService: IRegionModuleService

            const createAssignedRegions = async (
                data: { name: string; currency_code: string; countries: string[] }[]
            ) => {
                const regions = await regionModuleService.createRegions(data)
                await linkSellerRegions(
                    appContainer,
                    sellerId,
                    regions.map((r) => r.id)
                )
                return regions
            }

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
                sellerId = result.seller.id
            })

            describe("GET /vendor/regions", () => {
                it("should list regions", async () => {
                    await createAssignedRegions([
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
                    await createAssignedRegions([
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
                    await createAssignedRegions([
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
                    await createAssignedRegions([
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

                it("should hide regions that are not assigned to the seller", async () => {
                    const [assigned] = await createAssignedRegions([
                        { name: "Assigned Region", currency_code: "usd", countries: ["us"] },
                    ])
                    await regionModuleService.createRegions([
                        { name: "Unassigned Region", currency_code: "eur", countries: ["de"] },
                    ])

                    const response = await api.get(`/vendor/regions`, sellerHeaders)

                    expect(response.status).toEqual(200)
                    expect(response.data.regions.map((r: any) => r.id)).toEqual([
                        assigned.id,
                    ])
                    expect(response.data.count).toEqual(1)
                })

                it("should return an empty list when the seller has no regions", async () => {
                    await regionModuleService.createRegions([
                        { name: "Unassigned Region", currency_code: "eur", countries: ["de"] },
                    ])

                    const response = await api.get(`/vendor/regions`, sellerHeaders)

                    expect(response.status).toEqual(200)
                    expect(response.data.regions).toEqual([])
                    expect(response.data.count).toEqual(0)
                })

                it("should support pagination", async () => {
                    await createAssignedRegions([
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
                    const [region] = await createAssignedRegions([
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

                it("should return 404 for a region not assigned to the seller", async () => {
                    const [region] = await regionModuleService.createRegions([
                        { name: "Other Seller Region", currency_code: "usd", countries: ["us"] },
                    ])

                    const response = await api
                        .get(`/vendor/regions/${region.id}`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
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
