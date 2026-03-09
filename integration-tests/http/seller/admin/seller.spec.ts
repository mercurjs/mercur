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

      describe("POST /admin/sellers/:id", () => {
        describe("basic field updates", () => {
          it("should update seller name", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              { name: "New Name" },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller).toEqual(
              expect.objectContaining({
                id: seller1.id,
                name: "New Name",
              })
            )
          })

          it("should update seller email", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              { email: "new@test.com" },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller).toEqual(
              expect.objectContaining({
                id: seller1.id,
                email: "new@test.com",
              })
            )
          })

          it("should update seller handle", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              { handle: "new-handle" },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller).toEqual(
              expect.objectContaining({
                id: seller1.id,
                handle: "new-handle",
              })
            )
          })

          it("should update multiple fields at once", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              {
                name: "Updated Name",
                email: "updated@test.com",
                phone: "+1234567890",
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller).toEqual(
              expect.objectContaining({
                id: seller1.id,
                name: "Updated Name",
                email: "updated@test.com",
                phone: "+1234567890",
              })
            )
          })

          it("should update address fields", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              {
                address_1: "123 Main St",
                city: "New York",
                country_code: "US",
                postal_code: "10001",
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller).toEqual(
              expect.objectContaining({
                id: seller1.id,
                address_1: "123 Main St",
                city: "New York",
                country_code: "US",
                postal_code: "10001",
              })
            )
          })

          it("should update nullable fields to null", async () => {
            // First set some values
            await api.post(
              `/admin/sellers/${seller1.id}`,
              { phone: "+1234567890", logo: "https://example.com/logo.png" },
              adminHeaders
            )

            // Then set them to null
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              { phone: null, logo: null },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller.phone).toBeNull()
            expect(response.data.seller.logo).toBeNull()
          })

          it("should update logo and cover_image", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              {
                logo: "https://example.com/logo.png",
                cover_image: "https://example.com/cover.png",
              },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller).toEqual(
              expect.objectContaining({
                logo: "https://example.com/logo.png",
                cover_image: "https://example.com/cover.png",
              })
            )
          })

          it("should trim whitespace from name", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              { name: "  New Name  " },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller.name).toEqual("New Name")
          })

          it("should trim whitespace from handle", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              { handle: "  new-handle  " },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller.handle).toEqual("new-handle")
          })
        })

        describe("status transitions", () => {
          it("should transition from pending to active", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              { status: "active" },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller.status).toEqual("active")

            // Confirm with GET
            const getResponse = await api.get(
              `/admin/sellers/${seller1.id}`,
              adminHeaders
            )
            expect(getResponse.data.seller.status).toEqual("active")
          })

          it("should transition from active to suspended", async () => {
            // First set to active
            await api.post(
              `/admin/sellers/${seller1.id}`,
              { status: "active" },
              adminHeaders
            )

            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              { status: "suspended" },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller.status).toEqual("suspended")

            // Confirm with GET
            const getResponse = await api.get(
              `/admin/sellers/${seller1.id}`,
              adminHeaders
            )
            expect(getResponse.data.seller.status).toEqual("suspended")
          })

          it("should transition from suspended to active", async () => {
            // First set to suspended
            await api.post(
              `/admin/sellers/${seller1.id}`,
              { status: "active" },
              adminHeaders
            )
            await api.post(
              `/admin/sellers/${seller1.id}`,
              { status: "suspended" },
              adminHeaders
            )

            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              { status: "active" },
              adminHeaders
            )

            expect(response.status).toEqual(200)
            expect(response.data.seller.status).toEqual("active")

            // Confirm with GET
            const getResponse = await api.get(
              `/admin/sellers/${seller1.id}`,
              adminHeaders
            )
            expect(getResponse.data.seller.status).toEqual("active")
          })
        })

        describe("validation and error cases", () => {
          it("should reject invalid handle with special chars", async () => {
            const response = await api
              .post(
                `/admin/sellers/${seller1.id}`,
                { handle: "not valid!" },
                adminHeaders
              )
              .catch((e) => e.response)

            expect(response.status).toBeGreaterThanOrEqual(400)
            expect(response.status).toBeLessThan(500)
          })

          it("should reject invalid email", async () => {
            const response = await api
              .post(
                `/admin/sellers/${seller1.id}`,
                { email: "not-an-email" },
                adminHeaders
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
          })

          it("should reject invalid status value", async () => {
            const response = await api
              .post(
                `/admin/sellers/${seller1.id}`,
                { status: "invalid" },
                adminHeaders
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
          })

          it("should reject unknown fields (strict schema)", async () => {
            const response = await api
              .post(
                `/admin/sellers/${seller1.id}`,
                { unknown_field: "x" },
                adminHeaders
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
          })

          it("should reject empty name", async () => {
            const response = await api
              .post(
                `/admin/sellers/${seller1.id}`,
                { name: "" },
                adminHeaders
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
          })

          it("should reject empty handle", async () => {
            const response = await api
              .post(
                `/admin/sellers/${seller1.id}`,
                { handle: "" },
                adminHeaders
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(400)
          })

          it("should return 404 for non-existent seller", async () => {
            const response = await api
              .post(
                `/admin/sellers/non_existent_id`,
                { name: "New Name" },
                adminHeaders
              )
              .catch((e) => e.response)

            expect(response.status).toEqual(404)
          })
        })

        describe("authorization", () => {
          it("should require authentication for update", async () => {
            const response = await api
              .post(`/admin/sellers/${seller1.id}`, { name: "New Name" })
              .catch((e) => e.response)

            expect(response.status).toEqual(401)
          })
        })

        describe("idempotency and edge cases", () => {
          it("should accept empty body with no changes", async () => {
            const response = await api.post(
              `/admin/sellers/${seller1.id}`,
              {},
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

          it("should not affect other sellers when updating one", async () => {
            await api.post(
              `/admin/sellers/${seller1.id}`,
              { name: "Updated Alpha" },
              adminHeaders
            )

            const response = await api.get(
              `/admin/sellers/${seller2.id}`,
              adminHeaders
            )

            expect(response.data.seller.name).toEqual("Beta Seller")
          })

          it("should reject duplicate handle", async () => {
            // Set a known handle on seller2
            await api.post(
              `/admin/sellers/${seller2.id}`,
              { handle: "unique-handle" },
              adminHeaders
            )

            // Try to set seller1's handle to the same value
            const response = await api
              .post(
                `/admin/sellers/${seller1.id}`,
                { handle: "unique-handle" },
                adminHeaders
              )
              .catch((e) => e.response)

            // Should fail (could be 400, 409, or 500 depending on error mapping)
            expect(response.status).not.toEqual(200)

            // Confirm seller1's handle was not changed
            const getResponse = await api.get(
              `/admin/sellers/${seller1.id}`,
              adminHeaders
            )
            expect(getResponse.data.seller.handle).not.toEqual("unique-handle")
          })
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
