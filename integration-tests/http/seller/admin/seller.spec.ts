import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Sellers", () => {
      let appContainer: MedusaContainer
      let seller1: any
      let seller2: any
      let seller3: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        // Create multiple sellers for testing
        const result1 = await createSellerUser(appContainer, {
          email: "seller1@test.com",
          name: "Alpha Seller",
        })
        seller1 = result1.seller

        const result2 = await createSellerUser(appContainer, {
          email: "seller2@test.com",
          name: "Beta Seller",
        })
        seller2 = result2.seller

        const result3 = await createSellerUser(appContainer, {
          email: "seller3@test.com",
          name: "Gamma Seller",
        })
        seller3 = result3.seller
      })

      describe("GET /admin/sellers", () => {
        it("should list all sellers", async () => {
          const response = await api.get(`/admin/sellers`, adminHeaders)

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toBeDefined()
          expect(Array.isArray(response.data.sellers)).toBe(true)
          expect(response.data.count).toBeGreaterThanOrEqual(3)
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })

        it("should return sellers with correct fields", async () => {
          const response = await api.get(`/admin/sellers`, adminHeaders)

          expect(response.status).toEqual(200)
          const seller = response.data.sellers.find((s: any) => s.id === seller1.id)

          expect(seller).toEqual(
            expect.objectContaining({
              id: seller1.id,
              name: "Alpha Seller",
              email: "seller1@test.com",
            })
          )
        })

        it("should filter sellers by id", async () => {
          const response = await api.get(
            `/admin/sellers?id=${seller1.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].id).toEqual(seller1.id)
        })

        it("should filter sellers by multiple ids", async () => {
          const response = await api.get(
            `/admin/sellers?id[]=${seller1.id}&id[]=${seller2.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(2)
          const sellerIds = response.data.sellers.map((s: any) => s.id)
          expect(sellerIds).toContain(seller1.id)
          expect(sellerIds).toContain(seller2.id)
        })

        it("should filter sellers by name", async () => {
          const response = await api.get(
            `/admin/sellers?name=Alpha Seller`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].name).toEqual("Alpha Seller")
        })

        it("should filter sellers by email", async () => {
          const response = await api.get(
            `/admin/sellers?email=seller2@test.com`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].email).toEqual("seller2@test.com")
        })

        it("should search sellers with q parameter", async () => {
          const response = await api.get(
            `/admin/sellers?q=Beta`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers.length).toBeGreaterThanOrEqual(1)
          const hasBetaSeller = response.data.sellers.some(
            (s: any) => s.name === "Beta Seller"
          )
          expect(hasBetaSeller).toBe(true)
        })

        it("should paginate sellers with limit", async () => {
          const response = await api.get(
            `/admin/sellers?limit=2`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers.length).toBeLessThanOrEqual(2)
          expect(response.data.limit).toEqual(2)
        })

        it("should paginate sellers with offset", async () => {
          const firstPage = await api.get(
            `/admin/sellers?limit=1&offset=0`,
            adminHeaders
          )

          const secondPage = await api.get(
            `/admin/sellers?limit=1&offset=1`,
            adminHeaders
          )

          expect(firstPage.status).toEqual(200)
          expect(secondPage.status).toEqual(200)
          expect(firstPage.data.sellers[0].id).not.toEqual(
            secondPage.data.sellers[0].id
          )
        })

        it("should select specific fields", async () => {
          const response = await api.get(
            `/admin/sellers?fields=id,name`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers.length).toBeGreaterThan(0)

          const seller = response.data.sellers[0]
          expect(seller.id).toBeDefined()
          expect(seller.name).toBeDefined()
        })

        it("should return empty array when no sellers match filter", async () => {
          const response = await api.get(
            `/admin/sellers?name=NonExistentSeller`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(0)
          expect(response.data.count).toEqual(0)
        })
      })

      describe("GET /admin/sellers/:id", () => {
        it("should get a seller by id", async () => {
          const response = await api.get(
            `/admin/sellers/${seller1.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller).toEqual(
            expect.objectContaining({
              id: seller1.id,
              name: "Alpha Seller",
              email: "seller1@test.com",
            })
          )
        })

        it("should return seller with all default fields", async () => {
          const response = await api.get(
            `/admin/sellers/${seller1.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          const seller = response.data.seller

          expect(seller).toHaveProperty("id")
          expect(seller).toHaveProperty("name")
          expect(seller).toHaveProperty("email")
          expect(seller).toHaveProperty("created_at")
          expect(seller).toHaveProperty("updated_at")
        })

        it("should return 404 for non-existent seller", async () => {
          const response = await api
            .get(`/admin/sellers/non_existent_id`, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })

        it("should select specific fields for a single seller", async () => {
          const response = await api.get(
            `/admin/sellers/${seller1.id}?fields=id,name,email`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.id).toEqual(seller1.id)
          expect(response.data.seller.name).toEqual("Alpha Seller")
          expect(response.data.seller.email).toEqual("seller1@test.com")
        })

        it("should get different sellers by their ids", async () => {
          const response1 = await api.get(
            `/admin/sellers/${seller1.id}`,
            adminHeaders
          )
          const response2 = await api.get(
            `/admin/sellers/${seller2.id}`,
            adminHeaders
          )
          const response3 = await api.get(
            `/admin/sellers/${seller3.id}`,
            adminHeaders
          )

          expect(response1.status).toEqual(200)
          expect(response2.status).toEqual(200)
          expect(response3.status).toEqual(200)

          expect(response1.data.seller.name).toEqual("Alpha Seller")
          expect(response2.data.seller.name).toEqual("Beta Seller")
          expect(response3.data.seller.name).toEqual("Gamma Seller")
        })
      })

      describe("Admin sellers authorization", () => {
        it("should require authentication for listing sellers", async () => {
          const response = await api
            .get(`/admin/sellers`)
            .catch((e) => e.response)

          expect(response.status).toEqual(401)
        })

        it("should require authentication for getting a seller", async () => {
          const response = await api
            .get(`/admin/sellers/${seller1.id}`)
            .catch((e) => e.response)

          expect(response.status).toEqual(401)
        })
      })
    })
  },
})
