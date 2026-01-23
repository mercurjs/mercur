import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Currencies", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer, {
                    email: "seller@test.com",
                    name: "Test Seller",
                })
                sellerHeaders = result.headers
            })

            describe("GET /vendor/currencies", () => {
                it("should list currencies", async () => {
                    const response = await api.get(
                        `/vendor/currencies`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.currencies).toBeDefined()
                    expect(response.data.currencies.length).toBeGreaterThan(0)

                    const codes = response.data.currencies.map((c: any) => c.code)
                    expect(codes).toContain("usd")
                })

                it("should filter currencies by code", async () => {
                    const response = await api.get(
                        `/vendor/currencies?code=usd`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.currencies).toHaveLength(1)
                    expect(response.data.currencies[0].code).toEqual("usd")
                })

                it("should filter currencies by multiple codes", async () => {
                    const response = await api.get(
                        `/vendor/currencies?code[]=usd&code[]=eur`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.currencies.length).toBeGreaterThanOrEqual(1)

                    const codes = response.data.currencies.map((c: any) => c.code)
                    expect(codes.some((code: string) => ["usd", "eur"].includes(code))).toBe(true)
                })

                it("should search currencies with q parameter", async () => {
                    const response = await api.get(
                        `/vendor/currencies?q=dollar`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.currencies.length).toBeGreaterThanOrEqual(1)
                })

                it("should support pagination", async () => {
                    const response = await api.get(
                        `/vendor/currencies?limit=5&offset=0`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.currencies.length).toBeLessThanOrEqual(5)
                    expect(response.data.limit).toEqual(5)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/currencies/:code", () => {
                it("should get a currency by code", async () => {
                    const response = await api.get(
                        `/vendor/currencies/usd`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.currency).toBeDefined()
                    expect(response.data.currency.code).toEqual("usd")
                    expect(response.data.currency.name).toBeDefined()
                    expect(response.data.currency.symbol).toBeDefined()
                })

                it("should get EUR currency", async () => {
                    const response = await api.get(
                        `/vendor/currencies/eur`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.currency).toBeDefined()
                    expect(response.data.currency.code).toEqual("eur")
                })

                it("should return 404 for non-existent currency code", async () => {
                    const response = await api
                        .get(`/vendor/currencies/xyz`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
