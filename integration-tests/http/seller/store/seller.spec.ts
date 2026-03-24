import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Sellers", () => {
      let appContainer: MedusaContainer
      let sellerA: any
      let sellerB: any
      let sellerC: any
      let storeHeaders: Record<string, Record<string, string>>

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const resultA = await createSellerUser(appContainer, {
          email: "alpha@test.com",
          name: "Alpha Store",
        })
        sellerA = resultA.seller

        const resultB = await createSellerUser(appContainer, {
          email: "beta@test.com",
          name: "Beta Premium",
        })
        sellerB = resultB.seller

        const resultC = await createSellerUser(appContainer, {
          email: "gamma@test.com",
          name: "Gamma Shop",
        })
        sellerC = resultC.seller

        // Approve all three sellers so they become OPEN
        await api.post(
          `/admin/sellers/${sellerA.id}/approve`,
          {},
          adminHeaders
        )
        await api.post(
          `/admin/sellers/${sellerB.id}/approve`,
          {},
          adminHeaders
        )
        await api.post(
          `/admin/sellers/${sellerC.id}/approve`,
          {},
          adminHeaders
        )

        // Set seller B as premium
        await api.post(
          `/admin/sellers/${sellerB.id}`,
          { is_premium: true },
          adminHeaders
        )

        // Generate store headers with publishable key
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })
      })

      describe("GET /store/sellers", () => {
        it("should list active sellers", async () => {
          const response = await api.get(`/store/sellers`, storeHeaders)

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toBeDefined()
          expect(Array.isArray(response.data.sellers)).toBe(true)
          expect(response.data.count).toBeGreaterThanOrEqual(3)
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })

        it("should filter sellers by is_premium=true", async () => {
          const response = await api.get(
            `/store/sellers?is_premium=true`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers.length).toBeGreaterThanOrEqual(1)
          response.data.sellers.forEach((seller: any) => {
            expect(seller.is_premium).toEqual(true)
          })
        })

        it("should filter sellers by is_premium=false", async () => {
          const response = await api.get(
            `/store/sellers?is_premium=false`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers.length).toBeGreaterThanOrEqual(1)
          response.data.sellers.forEach((seller: any) => {
            expect(seller.is_premium).not.toEqual(true)
          })
        })

        it("should filter sellers by handle", async () => {
          const response = await api.get(
            `/store/sellers?handle=alpha-store`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].handle).toEqual("alpha-store")
        })

        it("should filter sellers by name", async () => {
          const response = await api.get(
            `/store/sellers?name=Alpha Store`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].name).toEqual("Alpha Store")
        })

        it("should filter sellers by multiple names", async () => {
          const response = await api.get(
            `/store/sellers?name[]=Alpha Store&name[]=Beta Premium`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(2)
          const names = response.data.sellers.map((s: any) => s.name)
          expect(names).toContain("Alpha Store")
          expect(names).toContain("Beta Premium")
        })

        it("should filter sellers by id", async () => {
          const response = await api.get(
            `/store/sellers?id=${sellerA.id}`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].id).toEqual(sellerA.id)
        })

        it("should filter sellers by multiple ids", async () => {
          const response = await api.get(
            `/store/sellers?id[]=${sellerA.id}&id[]=${sellerB.id}`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(2)
          const ids = response.data.sellers.map((s: any) => s.id)
          expect(ids).toContain(sellerA.id)
          expect(ids).toContain(sellerB.id)
        })

        it("should search sellers by name with q param", async () => {
          const response = await api.get(
            `/store/sellers?q=Alpha`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers.length).toBeGreaterThanOrEqual(1)
          const names = response.data.sellers.map((s: any) => s.name)
          expect(names).toContain("Alpha Store")
        })

        it("should return empty for non-matching search", async () => {
          const response = await api.get(
            `/store/sellers?q=nonexistent`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(0)
          expect(response.data.count).toEqual(0)
        })

        it("should support limit", async () => {
          const response = await api.get(
            `/store/sellers?limit=1`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.limit).toEqual(1)
        })

        it("should support offset", async () => {
          const first = await api.get(
            `/store/sellers?limit=1&offset=0`,
            storeHeaders
          )
          const second = await api.get(
            `/store/sellers?limit=1&offset=1`,
            storeHeaders
          )

          expect(first.data.sellers[0].id).not.toEqual(
            second.data.sellers[0].id
          )
        })

        it("should return correct count with pagination", async () => {
          const response = await api.get(
            `/store/sellers?limit=1`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.count).toBeGreaterThanOrEqual(3)
        })

        it("should only return OPEN sellers (exclude pending)", async () => {
          const { seller: pendingSeller } = await createSellerUser(
            appContainer,
            {
              email: "pending@test.com",
              name: "Pending Seller",
            }
          )

          const response = await api.get(`/store/sellers`, storeHeaders)

          const ids = response.data.sellers.map((s: any) => s.id)
          expect(ids).not.toContain(pendingSeller.id)
        })

        it("should exclude suspended sellers", async () => {
          const { seller: suspendedSeller } = await createSellerUser(
            appContainer,
            {
              email: "suspended@test.com",
              name: "Suspended Seller",
            }
          )

          await api.post(
            `/admin/sellers/${suspendedSeller.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${suspendedSeller.id}/suspend`,
            {},
            adminHeaders
          )

          const response = await api.get(`/store/sellers`, storeHeaders)

          const ids = response.data.sellers.map((s: any) => s.id)
          expect(ids).not.toContain(suspendedSeller.id)
        })

        it("should exclude sellers within closure window", async () => {
          const now = new Date()
          const pastDate = new Date(
            now.getTime() - 24 * 60 * 60 * 1000
          ).toISOString()
          const futureDate = new Date(
            now.getTime() + 24 * 60 * 60 * 1000
          ).toISOString()

          await api.post(
            `/admin/sellers/${sellerC.id}`,
            {
              closed_from: pastDate,
              closed_to: futureDate,
            },
            adminHeaders
          )

          const response = await api.get(`/store/sellers`, storeHeaders)

          const ids = response.data.sellers.map((s: any) => s.id)
          expect(ids).not.toContain(sellerC.id)
        })

        it("should not expose sensitive fields", async () => {
          const response = await api.get(`/store/sellers`, storeHeaders)

          expect(response.status).toEqual(200)
          response.data.sellers.forEach((seller: any) => {
            expect(seller).not.toHaveProperty("email")
            expect(seller).not.toHaveProperty("currency_code")
            expect(seller).not.toHaveProperty("status")
            expect(seller).not.toHaveProperty("status_reason")
            expect(seller).not.toHaveProperty("closed_from")
            expect(seller).not.toHaveProperty("closed_to")
          })
        })
      })

      // describe("GET /store/sellers/:id", () => {
      //   it("should retrieve a single seller by id", async () => {
      //     const response = await api.get(
      //       `/store/sellers/${sellerA.id}`,
      //       storeHeaders
      //     )

      //     expect(response.status).toEqual(200)
      //     expect(response.data.seller).toBeDefined()
      //     expect(response.data.seller.id).toEqual(sellerA.id)
      //     expect(response.data.seller.name).toEqual("Alpha Store")
      //     expect(response.data.seller.handle).toEqual("alpha-store")
      //   })

      //   it("should return 404 for non-existent seller", async () => {
      //     const response = await api
      //       .get(`/store/sellers/sel_nonexistent`, storeHeaders)
      //       .catch((e) => e.response)

      //     expect(response.status).toEqual(404)
      //   })

      //   it("should return 404 for pending seller", async () => {
      //     const { seller: pendingSeller } = await createSellerUser(
      //       appContainer,
      //       {
      //         email: "pending2@test.com",
      //         name: "Pending Seller 2",
      //       }
      //     )

      //     const response = await api
      //       .get(`/store/sellers/${pendingSeller.id}`, storeHeaders)
      //       .catch((e) => e.response)

      //     expect(response.status).toEqual(404)
      //   })

      //   it("should return 404 for suspended seller", async () => {
      //     const { seller: suspendedSeller } = await createSellerUser(
      //       appContainer,
      //       {
      //         email: "suspended2@test.com",
      //         name: "Suspended Seller 2",
      //       }
      //     )

      //     await api.post(
      //       `/admin/sellers/${suspendedSeller.id}/approve`,
      //       {},
      //       adminHeaders
      //     )
      //     await api.post(
      //       `/admin/sellers/${suspendedSeller.id}/suspend`,
      //       {},
      //       adminHeaders
      //     )

      //     const response = await api
      //       .get(`/store/sellers/${suspendedSeller.id}`, storeHeaders)
      //       .catch((e) => e.response)

      //     expect(response.status).toEqual(404)
      //   })

      //   it("should return only default fields", async () => {
      //     const response = await api.get(
      //       `/store/sellers/${sellerA.id}`,
      //       storeHeaders
      //     )

      //     expect(response.status).toEqual(200)
      //     const seller = response.data.seller
      //     expect(seller).toHaveProperty("id")
      //     expect(seller).toHaveProperty("name")
      //     expect(seller).toHaveProperty("handle")
      //     expect(seller).toHaveProperty("description")
      //     expect(seller).toHaveProperty("is_premium")
      //     expect(seller).toHaveProperty("metadata")
      //     expect(seller).not.toHaveProperty("email")
      //     expect(seller).not.toHaveProperty("status")
      //     expect(seller).not.toHaveProperty("currency_code")
      //     expect(seller).not.toHaveProperty("closed_from")
      //     expect(seller).not.toHaveProperty("closed_to")
      //   })
      // })
    })
  },
})
