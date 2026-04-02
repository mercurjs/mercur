import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Sellers", () => {
      let appContainer: MedusaContainer
      let sellerA: any
      let sellerB: any
      let sellerC: any
      let memberA: any
      let memberB: any
      let memberC: any

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
        memberA = resultA.member

        const resultB = await createSellerUser(appContainer, {
          email: "beta@test.com",
          name: "Beta Premium",
        })
        sellerB = resultB.seller
        memberB = resultB.member

        const resultC = await createSellerUser(appContainer, {
          email: "gamma@test.com",
          name: "Gamma Shop",
        })
        sellerC = resultC.seller
        memberC = resultC.member
      })

      describe("POST /admin/sellers", () => {
        it("should create a seller with required fields", async () => {
          const response = await api.post(
            `/admin/sellers`,
            {
              name: "New Seller",
              email: "newseller@test.com",
              currency_code: "usd",
              member: { email: "newseller@test.com" },
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller).toEqual(
            expect.objectContaining({
              name: "New Seller",
              email: "newseller@test.com",
              currency_code: "usd",
            })
          )
        })

        it("should auto-generate handle from name", async () => {
          const response = await api.post(
            `/admin/sellers`,
            {
              name: "My Awesome Store",
              email: "awesome@test.com",
              currency_code: "usd",
              member: { email: "awesome@test.com" },
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller.handle).toEqual("my-awesome-store")
        })

        it("should default status to pending_approval", async () => {
          const response = await api.post(
            `/admin/sellers`,
            {
              name: "Pending Seller",
              email: "pending@test.com",
              currency_code: "usd",
              member: { email: "pending@test.com" },
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller.status).toEqual("pending_approval")
        })

        it("should create an associated member with the provided email", async () => {
          const response = await api.post(
            `/admin/sellers`,
            {
              name: "Member Test Seller",
              email: "membertest@test.com",
              currency_code: "usd",
              member: { email: "membertest@test.com" },
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)

          const membersResponse = await api.get(
            `/admin/sellers/${response.data.seller.id}/members`,
            adminHeaders
          )

          expect(membersResponse.data.seller_members).toHaveLength(1)
        })

        it("should set the first member as owner", async () => {
          const response = await api.post(
            `/admin/sellers`,
            {
              name: "Owner Test Seller",
              email: "ownertest@test.com",
              currency_code: "usd",
              member: { email: "ownertest@test.com" },
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)

          const membersResponse = await api.get(
            `/admin/sellers/${response.data.seller.id}/members`,
            adminHeaders
          )

          expect(membersResponse.data.seller_members[0].is_owner).toBe(true)
        })

        it("should create a seller with all optional fields", async () => {
          const response = await api.post(
            `/admin/sellers`,
            {
              name: "Full Seller",
              handle: "custom-handle",
              email: "full@test.com",
              currency_code: "eur",
              description: "A great seller",
              website_url: "https://example.com",
              external_id: "ext-123",
              is_premium: true,
              metadata: { key: "value" },
              member: { email: "full@test.com" },
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller).toEqual(
            expect.objectContaining({
              name: "Full Seller",
              handle: "custom-handle",
              description: "A great seller",
              website_url: "https://example.com",
              external_id: "ext-123",
              is_premium: true,
            })
          )
        })

        it("should use provided handle instead of auto-generating", async () => {
          const response = await api.post(
            `/admin/sellers`,
            {
              name: "Handle Override",
              handle: "my-custom-handle",
              email: "handleoverride@test.com",
              currency_code: "usd",
              member: { email: "handleoverride@test.com" },
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller.handle).toEqual("my-custom-handle")
        })

        it("should create a seller with is_premium true", async () => {
          const response = await api.post(
            `/admin/sellers`,
            {
              name: "Premium Seller",
              email: "premium@test.com",
              currency_code: "usd",
              is_premium: true,
              member: { email: "premium@test.com" },
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller.is_premium).toBe(true)
        })

        it("should fail for missing name", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              {
                email: "noname@test.com",
                currency_code: "usd",
                member: { email: "noname@test.com" },
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing email", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              {
                name: "No Email Seller",
                currency_code: "usd",
                member: { email: "noemail@test.com" },
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing currency_code", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              {
                name: "No Currency",
                email: "nocurrency@test.com",
                member: { email: "nocurrency@test.com" },
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing member object", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              {
                name: "No Member",
                email: "nomember@test.com",
                currency_code: "usd",
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for invalid email format", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              {
                name: "Bad Email",
                email: "not-an-email",
                currency_code: "usd",
                member: { email: "bad@test.com" },
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for invalid logo URL format", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              {
                name: "Bad Logo",
                email: "badlogo@test.com",
                currency_code: "usd",
                logo: "not-a-url",
                member: { email: "badlogo@test.com" },
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for invalid banner URL format", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              {
                name: "Bad Banner",
                email: "badbanner@test.com",
                currency_code: "usd",
                banner: "not-a-url",
                member: { email: "badbanner@test.com" },
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for duplicate seller email", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              {
                name: "Duplicate Email Seller",
                email: "alpha@test.com",
                currency_code: "usd",
                member: { email: "dupemail@test.com" },
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail for duplicate seller name", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              {
                name: "Alpha Store",
                email: "uniqueemail@test.com",
                currency_code: "usd",
                member: { email: "uniqueemail@test.com" },
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("GET /admin/sellers", () => {
        it("should list all sellers", async () => {
          const response = await api.get(`/admin/sellers`, adminHeaders)

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toBeDefined()
          expect(response.data.sellers.length).toBeGreaterThanOrEqual(3)
        })

        it("should return count, offset, limit in response", async () => {
          const response = await api.get(`/admin/sellers`, adminHeaders)

          expect(response.status).toEqual(200)
          expect(response.data.count).toBeDefined()
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })

        it("should filter by status pending_approval", async () => {
          const response = await api.get(
            `/admin/sellers?status=pending_approval`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          response.data.sellers.forEach((seller: any) => {
            expect(seller.status).toEqual("pending_approval")
          })
        })

        it("should filter by status open", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )

          const response = await api.get(
            `/admin/sellers?status=open`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers.length).toBeGreaterThanOrEqual(1)
          response.data.sellers.forEach((seller: any) => {
            expect(seller.status).toEqual("open")
          })
        })

        it("should filter by is_premium true", async () => {
          await api.post(
            `/admin/sellers/${sellerB.id}`,
            { is_premium: true },
            adminHeaders
          )

          const response = await api.get(
            `/admin/sellers?is_premium=true`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers.length).toBeGreaterThanOrEqual(1)
          response.data.sellers.forEach((seller: any) => {
            expect(seller.is_premium).toBe(true)
          })
        })

        it("should filter by is_premium false", async () => {
          await api.post(
            `/admin/sellers/${sellerB.id}`,
            { is_premium: true },
            adminHeaders
          )

          const response = await api.get(
            `/admin/sellers?is_premium=false`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          response.data.sellers.forEach((seller: any) => {
            expect(seller.is_premium).toBe(false)
          })
        })

        it("should filter by name", async () => {
          const response = await api.get(
            `/admin/sellers?name=Alpha+Store`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].name).toEqual("Alpha Store")
        })

        it("should filter by name array", async () => {
          const response = await api.get(
            `/admin/sellers?name[]=Alpha+Store&name[]=Beta+Premium`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(2)
        })

        it("should filter by id", async () => {
          const response = await api.get(
            `/admin/sellers?id=${sellerA.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].id).toEqual(sellerA.id)
        })

        it("should filter by id array", async () => {
          const response = await api.get(
            `/admin/sellers?id[]=${sellerA.id}&id[]=${sellerC.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(2)
        })

        it("should filter by email", async () => {
          const response = await api.get(
            `/admin/sellers?email=alpha@test.com`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].email).toEqual("alpha@test.com")
        })

        it("should filter by handle", async () => {
          const response = await api.get(
            `/admin/sellers?handle=alpha-store`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.sellers[0].handle).toEqual("alpha-store")
        })

        it("should search by q param", async () => {
          const response = await api.get(
            `/admin/sellers?q=Alpha`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers.length).toBeGreaterThanOrEqual(1)
          expect(response.data.sellers[0].name).toContain("Alpha")
        })

        it("should return empty for non-matching search", async () => {
          const response = await api.get(
            `/admin/sellers?q=nonexistentseller`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(0)
        })

        it("should support limit pagination", async () => {
          const response = await api.get(
            `/admin/sellers?limit=1`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.limit).toEqual(1)
        })

        it("should support offset pagination", async () => {
          const response = await api.get(
            `/admin/sellers?offset=1&limit=1`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toHaveLength(1)
          expect(response.data.offset).toEqual(1)
        })

        it("should return correct total count with pagination", async () => {
          const response = await api.get(
            `/admin/sellers?limit=1`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toBeGreaterThanOrEqual(3)
        })
      })

      describe("GET /admin/sellers/:id", () => {
        it("should retrieve a seller by id with all fields", async () => {
          const response = await api.get(
            `/admin/sellers/${sellerA.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller).toEqual(
            expect.objectContaining({
              id: sellerA.id,
              name: "Alpha Store",
              email: "alpha@test.com",
              currency_code: "usd",
              status: "pending_approval",
            })
          )
        })

        it("should include nested members", async () => {
          const response = await api.get(
            `/admin/sellers/${sellerA.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.members).toBeDefined()
          expect(Array.isArray(response.data.seller.members)).toBe(true)
        })

        it("should return 404 for non-existent id", async () => {
          const response = await api
            .get(`/admin/sellers/sel_nonexistent`, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/sellers/:id", () => {
        it("should update seller name", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}`,
            { name: "Updated Alpha" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.name).toEqual("Updated Alpha")
        })

        it("should update seller description", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}`,
            { description: "Updated description" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.description).toEqual(
            "Updated description"
          )
        })

        it("should update is_premium flag", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}`,
            { is_premium: true },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.is_premium).toBe(true)
        })

        it("should update metadata", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}`,
            { metadata: { tier: "gold" } },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.metadata).toEqual({ tier: "gold" })
        })

        it("should update website_url", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}`,
            { website_url: "https://newsite.com" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.website_url).toEqual(
            "https://newsite.com"
          )
        })

        it("should return 404 for non-existent id", async () => {
          const response = await api
            .post(
              `/admin/sellers/sel_nonexistent`,
              { name: "Nope" },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("POST /admin/sellers/:id/approve", () => {
        it("should approve a pending_approval seller", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.status).toEqual("open")
        })

        it("should fail when seller is already open", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/approve`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail when seller is suspended", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/approve`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail when seller is terminated", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/terminate`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/approve`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("POST /admin/sellers/:id/suspend", () => {
        it("should suspend an open seller", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.status).toEqual("suspended")
        })

        it("should accept optional reason", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            { reason: "Policy violation" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.status).toEqual("suspended")
          expect(response.data.seller.status_reason).toEqual(
            "Policy violation"
          )
        })

        it("should suspend a pending_approval seller", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.status).toEqual("suspended")
        })

        it("should fail when seller is already suspended", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/suspend`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail when seller is terminated", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/terminate`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/suspend`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("POST /admin/sellers/:id/unsuspend", () => {
        it("should unsuspend a suspended seller", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/unsuspend`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.status).toEqual("open")
        })

        it("should fail when seller is open", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/unsuspend`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail when seller is pending_approval", async () => {
          const response = await api
            .post(`/admin/sellers/${sellerA.id}/unsuspend`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail when seller is terminated", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/terminate`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/unsuspend`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("POST /admin/sellers/:id/terminate", () => {
        it("should terminate a suspended seller", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/terminate`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.status).toEqual("terminated")
        })

        it("should accept optional reason", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/terminate`,
            { reason: "Terms of service violation" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.status_reason).toEqual(
            "Terms of service violation"
          )
        })

        it("should terminate a pending_approval seller", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/terminate`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.status).toEqual("terminated")
        })

        it("should fail when seller is open (must suspend first)", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/terminate`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail when seller is already terminated", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/terminate`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/terminate`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("POST /admin/sellers/:id/unterminate", () => {
        it("should unterminate a terminated seller", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/terminate`,
            {},
            adminHeaders
          )

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/unterminate`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.status).toEqual("suspended")
        })

        it("should fail when seller is open", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/unterminate`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail when seller is pending_approval", async () => {
          const response = await api
            .post(`/admin/sellers/${sellerA.id}/unterminate`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail when seller is suspended", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/sellers/${sellerA.id}/unterminate`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("Full Status Lifecycle", () => {
        it("should complete full cycle: pending_approval → open → suspended → terminated → suspended → open", async () => {
          // pending_approval → open
          let response = await api.post(
            `/admin/sellers/${sellerA.id}/approve`,
            {},
            adminHeaders
          )
          expect(response.data.seller.status).toEqual("open")

          // open → suspended
          response = await api.post(
            `/admin/sellers/${sellerA.id}/suspend`,
            {},
            adminHeaders
          )
          expect(response.data.seller.status).toEqual("suspended")

          // suspended → terminated
          response = await api.post(
            `/admin/sellers/${sellerA.id}/terminate`,
            {},
            adminHeaders
          )
          expect(response.data.seller.status).toEqual("terminated")

          // terminated → suspended
          response = await api.post(
            `/admin/sellers/${sellerA.id}/unterminate`,
            {},
            adminHeaders
          )
          expect(response.data.seller.status).toEqual("suspended")

          // suspended → open
          response = await api.post(
            `/admin/sellers/${sellerA.id}/unsuspend`,
            {},
            adminHeaders
          )
          expect(response.data.seller.status).toEqual("open")
        })
      })

      describe("POST /admin/sellers/:id/address", () => {
        it("should create address for seller", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/address`,
            {
              company: "Alpha Corp",
              first_name: "John",
              last_name: "Doe",
              address_1: "123 Main St",
              address_2: "Suite 100",
              city: "New York",
              country_code: "us",
              province: "NY",
              postal_code: "10001",
              phone: "+1234567890",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.address).toEqual(
            expect.objectContaining({
              company: "Alpha Corp",
              first_name: "John",
              last_name: "Doe",
              address_1: "123 Main St",
              city: "New York",
              country_code: "us",
            })
          )
        })

        it("should update existing address fields", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/address`,
            {
              company: "Alpha Corp",
              city: "New York",
            },
            adminHeaders
          )

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/address`,
            {
              city: "Los Angeles",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.address.city).toEqual("Los Angeles")
        })

        it("should return seller with nested address in response", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/address`,
            { city: "Chicago" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller).toBeDefined()
          expect(response.data.seller.address).toBeDefined()
        })
      })

      describe("POST /admin/sellers/:id/payment-details", () => {
        it("should create payment details with IBAN", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/payment-details`,
            {
              holder_name: "John Doe",
              bank_name: "First National",
              iban: "DE89370400440532013000",
              bic: "COBADEFFXXX",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.payment_details).toEqual(
            expect.objectContaining({
              holder_name: "John Doe",
              bank_name: "First National",
              iban: "DE89370400440532013000",
              bic: "COBADEFFXXX",
            })
          )
        })

        it("should create payment details with routing/account number", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/payment-details`,
            {
              holder_name: "Jane Doe",
              routing_number: "021000021",
              account_number: "123456789",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.payment_details).toEqual(
            expect.objectContaining({
              holder_name: "Jane Doe",
              routing_number: "021000021",
              account_number: "123456789",
            })
          )
        })

        it("should update existing payment details", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/payment-details`,
            { holder_name: "John Doe" },
            adminHeaders
          )

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/payment-details`,
            { holder_name: "Jane Doe" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.payment_details.holder_name).toEqual(
            "Jane Doe"
          )
        })

        it("should return seller with nested payment_details in response", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/payment-details`,
            { holder_name: "Test" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller).toBeDefined()
          expect(response.data.seller.payment_details).toBeDefined()
        })
      })

      describe("POST /admin/sellers/:id/professional-details", () => {
        it("should create professional details", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/professional-details`,
            {
              corporate_name: "Alpha Corp LLC",
              registration_number: "REG-12345",
              tax_id: "TAX-67890",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.professional_details).toEqual(
            expect.objectContaining({
              corporate_name: "Alpha Corp LLC",
              registration_number: "REG-12345",
              tax_id: "TAX-67890",
            })
          )
        })

        it("should update existing professional details", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/professional-details`,
            { corporate_name: "Alpha Corp LLC" },
            adminHeaders
          )

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/professional-details`,
            { corporate_name: "Alpha Corp Inc" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.seller.professional_details.corporate_name
          ).toEqual("Alpha Corp Inc")
        })

        it("should return seller with nested professional_details in response", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/professional-details`,
            { corporate_name: "Test Corp" },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller).toBeDefined()
          expect(response.data.seller.professional_details).toBeDefined()
        })
      })

      describe("DELETE /admin/sellers/:id/professional-details", () => {
        it("should remove professional details from seller", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/professional-details`,
            { corporate_name: "Alpha Corp LLC" },
            adminHeaders
          )

          const response = await api.delete(
            `/admin/sellers/${sellerA.id}/professional-details`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
        })

        it("should return seller with null professional_details after removal", async () => {
          await api.post(
            `/admin/sellers/${sellerA.id}/professional-details`,
            { corporate_name: "Alpha Corp LLC" },
            adminHeaders
          )

          await api.delete(
            `/admin/sellers/${sellerA.id}/professional-details`,
            adminHeaders
          )

          const getResponse = await api.get(
            `/admin/sellers/${sellerA.id}`,
            adminHeaders
          )

          expect(getResponse.data.seller.professional_details).toBeFalsy()
        })

        it("should succeed even if no professional details exist (idempotent)", async () => {
          const response = await api.delete(
            `/admin/sellers/${sellerA.id}/professional-details`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
        })
      })

      describe("GET /admin/sellers/:id/members", () => {
        it("should list members for a seller", async () => {
          const response = await api.get(
            `/admin/sellers/${sellerA.id}/members`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller_members).toBeDefined()
          expect(Array.isArray(response.data.seller_members)).toBe(true)
        })

        it("should return the owner member created during seller creation", async () => {
          const response = await api.get(
            `/admin/sellers/${sellerA.id}/members`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller_members.length).toBeGreaterThanOrEqual(1)
          const ownerMember = response.data.seller_members.find(
            (sm: any) => sm.is_owner === true
          )
          expect(ownerMember).toBeDefined()
        })

        it("should return count, offset, limit", async () => {
          const response = await api.get(
            `/admin/sellers/${sellerA.id}/members`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toBeDefined()
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })
      })

      describe("POST /admin/sellers/:id/members", () => {
        it("should add an existing member to a seller with a role_id", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/members`,
            {
              member_id: memberB.id,
              role_id: "role_test",
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller_member).toBeDefined()
        })

        it("should return the created seller_member", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/members`,
            {
              member_id: memberC.id,
              role_id: "role_test",
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller_member).toEqual(
            expect.objectContaining({
              role_id: "role_test",
            })
          )
        })
      })

      describe("DELETE /admin/sellers/:id/members/:member_id", () => {
        it("should remove a non-owner member from seller", async () => {
          // Add memberB to sellerA first
          const addResponse = await api.post(
            `/admin/sellers/${sellerA.id}/members`,
            {
              member_id: memberB.id,
              role_id: "role_test",
            },
            adminHeaders
          )

          const sellerMemberId = addResponse.data.seller_member.id

          const response = await api.delete(
            `/admin/sellers/${sellerA.id}/members/${sellerMemberId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data).toEqual(
            expect.objectContaining({
              id: sellerMemberId,
              object: "seller_member",
              deleted: true,
            })
          )
        })

        it("should fail when trying to remove the owner member", async () => {
          // Get the owner seller_member id
          const membersResponse = await api.get(
            `/admin/sellers/${sellerA.id}/members`,
            adminHeaders
          )

          const ownerSellerMember = membersResponse.data.seller_members.find(
            (sm: any) => sm.is_owner === true
          )

          const response = await api
            .delete(
              `/admin/sellers/${sellerA.id}/members/${ownerSellerMember.id}`,
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("POST /admin/sellers/:id/members/invite", () => {
        it("should create an invitation for a new email", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/members/invite`,
            {
              email: "newinvite@test.com",
              role_id: "role_test",
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.member_invite).toBeDefined()
        })

        it("should create invitation with email and role_id", async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/members/invite`,
            {
              email: "invitee@test.com",
              role_id: "role_admin",
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.member_invite).toEqual(
            expect.objectContaining({
              email: "invitee@test.com",
              role_id: "role_admin",
            })
          )
        })

        it("should fail for invalid email format", async () => {
          const response = await api
            .post(
              `/admin/sellers/${sellerA.id}/members/invite`,
              {
                email: "not-an-email",
                role_id: "role_test",
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing role_id", async () => {
          const response = await api
            .post(
              `/admin/sellers/${sellerA.id}/members/invite`,
              {
                email: "missingrole@test.com",
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })
      })
    })
  },
})
