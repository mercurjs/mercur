import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createSellerDefaultsWorkflow } from "@mercurjs/core-plugin/workflows"
import { SellerRole } from "@mercurjs/types"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor - Sellers", () => {
      let appContainer: MedusaContainer
      let sellerA: any
      let sellerB: any
      let sellerC: any
      let memberA: any
      let memberB: any
      let memberC: any
      let headersA: any
      let headersB: any
      let headersC: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createSellerDefaultsWorkflow(appContainer).run()
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const resultA = await createSellerUser(appContainer, {
          email: "alpha@test.com",
          name: "Alpha Store",
        })
        sellerA = resultA.seller
        memberA = resultA.member
        headersA = resultA.headers

        const resultB = await createSellerUser(appContainer, {
          email: "beta@test.com",
          name: "Beta Premium",
        })
        sellerB = resultB.seller
        memberB = resultB.member
        headersB = resultB.headers

        const resultC = await createSellerUser(appContainer, {
          email: "gamma@test.com",
          name: "Gamma Shop",
        })
        sellerC = resultC.seller
        memberC = resultC.member
        headersC = resultC.headers

        // Approve sellerA so tests have both pending and open sellers
        await api.post(
          `/admin/sellers/${sellerA.id}/approve`,
          {},
          adminHeaders
        )
      })

      /**
       * Helper: register via /auth/seller/emailpass/register endpoint
       * to get an unregistered JWT token for self-registration tests.
       */
      const createUnregisteredToken = async () => {
        const email = `unregistered-${Date.now()}@test.com`
        const password = "somepassword"

        const registerResponse = await api.post(
          `/auth/member/emailpass/register`,
          { email, password }
        )

        const { token } = registerResponse.data

        return {
          email,
          password,
          headers: {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        }
      }

      describe("POST /vendor/sellers", () => {
        it("should create seller with required fields", async () => {
          const { headers } = await createUnregisteredToken()

          const response = await api.post(
            `/vendor/sellers`,
            {
              name: "New Vendor",
              email: "newvendor@test.com",
              member_email: "newvendor-member@test.com",
              currency_code: "usd",
            },
            headers
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller).toEqual(
            expect.objectContaining({
              name: "New Vendor",
              email: "newvendor@test.com",
              currency_code: "usd",
            })
          )
        })

        it("should auto-generate handle from name", async () => {
          const { headers } = await createUnregisteredToken()

          const response = await api.post(
            `/vendor/sellers`,
            {
              name: "My Awesome Vendor",
              email: "awesomevendor@test.com",
              member_email: "awesomevendor-member@test.com",
              currency_code: "usd",
            },
            headers
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller.handle).toEqual("my-awesome-vendor")
        })

        it("should default status to pending_approval", async () => {
          const { headers } = await createUnregisteredToken()

          const response = await api.post(
            `/vendor/sellers`,
            {
              name: "Pending Vendor",
              email: "pendingvendor@test.com",
              member_email: "pendingvendor-member@test.com",
              currency_code: "usd",
            },
            headers
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller.status).toEqual("pending_approval")
        })

        it("should create an owner member linked to the new seller", async () => {
          const { email, password, headers } = await createUnregisteredToken()

          const createResponse = await api.post(
            `/vendor/sellers`,
            {
              name: "Member Check Vendor",
              email: "membercheck@test.com",
              member_email: "membercheck-member@test.com",
              currency_code: "usd",
            },
            headers
          )

          expect(createResponse.status).toEqual(201)

          const sellerId = createResponse.data.seller.id

          // Re-authenticate to get a token with actor_id set
          const authResponse = await api.post(
            `/auth/member/emailpass`,
            { email, password }
          )
          const authenticatedHeaders = {
            headers: {
              authorization: `Bearer ${authResponse.data.token}`,
              "x-seller-id": sellerId,
            },
          }

          const membersResponse = await api.get(
            `/vendor/sellers/${sellerId}/members`,
            authenticatedHeaders
          )

          expect(membersResponse.data.seller_members).toBeDefined()
          expect(membersResponse.data.seller_members.length).toEqual(1)

          const ownerMember = membersResponse.data.seller_members[0]
          expect(ownerMember.is_owner).toBe(true)
          expect(ownerMember.member).toBeDefined()
        })

        it("should include optional address during registration", async () => {
          const { headers } = await createUnregisteredToken()

          const response = await api.post(
            `/vendor/sellers`,
            {
              name: "Address Vendor",
              email: "addressvendor@test.com",
              member_email: "addressvendor-member@test.com",
              currency_code: "usd",
              address: {
                first_name: "John",
                last_name: "Doe",
                address_1: "123 Main St",
                city: "New York",
                country_code: "us",
                postal_code: "10001",
              },
            },
            headers
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller).toBeDefined()
        })

        it("should fail when already registered as member", async () => {
          const response = await api
            .post(
              `/vendor/sellers`,
              {
                name: "Duplicate Registration",
                email: "duplicate@test.com",
                member_email: "duplicate-member@test.com",
                currency_code: "usd",
              },
              headersA
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing name", async () => {
          const { headers } = await createUnregisteredToken()

          const response = await api
            .post(
              `/vendor/sellers`,
              {
                email: "noname@test.com",
                member_email: "noname-member@test.com",
                currency_code: "usd",
              },
              headers
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing email", async () => {
          const { headers } = await createUnregisteredToken()

          const response = await api
            .post(
              `/vendor/sellers`,
              {
                name: "No Email Vendor",
                member_email: "noemail-member@test.com",
                currency_code: "usd",
              },
              headers
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing currency_code", async () => {
          const { headers } = await createUnregisteredToken()

          const response = await api
            .post(
              `/vendor/sellers`,
              {
                name: "No Currency Vendor",
                email: "nocurrency@test.com",
                member_email: "nocurrency-member@test.com",
              },
              headers
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing member_email", async () => {
          const { headers } = await createUnregisteredToken()

          const response = await api
            .post(
              `/vendor/sellers`,
              {
                name: "No Member Email Vendor",
                email: "nomemberemail@test.com",
                currency_code: "usd",
              },
              headers
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for invalid email format", async () => {
          const { headers } = await createUnregisteredToken()

          const response = await api
            .post(
              `/vendor/sellers`,
              {
                name: "Bad Email Vendor",
                email: "not-an-email",
                member_email: "bademail-member@test.com",
                currency_code: "usd",
              },
              headers
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })
      })

      describe("GET /vendor/sellers", () => {
        it("should list seller_members for authenticated member", async () => {
          const response = await api.get(`/vendor/sellers`, headersA)

          expect(response.status).toEqual(200)
          expect(response.data.seller_members).toBeDefined()
          expect(Array.isArray(response.data.seller_members)).toBe(true)
          expect(response.data.seller_members.length).toBeGreaterThanOrEqual(1)
        })

        it("should return count, offset, limit", async () => {
          const response = await api.get(`/vendor/sellers`, headersA)

          expect(response.status).toEqual(200)
          expect(response.data.count).toBeDefined()
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })

        it("should support limit pagination", async () => {
          const response = await api.get(
            `/vendor/sellers?limit=1`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller_members.length).toBeLessThanOrEqual(1)
          expect(response.data.limit).toEqual(1)
        })

        it("should include linked seller data on each seller_member", async () => {
          const response = await api.get(`/vendor/sellers`, headersA)

          expect(response.status).toEqual(200)
          const sm = response.data.seller_members[0]
          expect(sm.seller).toBeDefined()
          expect(sm.seller.id).toEqual(sellerA.id)
        })

        it("should only return sellers for the authenticated member", async () => {
          const responseA = await api.get(`/vendor/sellers`, headersA)
          const responseB = await api.get(`/vendor/sellers`, headersB)

          const sellerIdsA = responseA.data.seller_members.map(
            (sm: any) => sm.seller.id
          )
          const sellerIdsB = responseB.data.seller_members.map(
            (sm: any) => sm.seller.id
          )

          expect(sellerIdsA).toContain(sellerA.id)
          expect(sellerIdsA).not.toContain(sellerB.id)
          expect(sellerIdsB).toContain(sellerB.id)
          expect(sellerIdsB).not.toContain(sellerA.id)
        })
      })

      describe("GET /vendor/sellers/:id", () => {
        it("should retrieve seller with all default fields", async () => {
          const response = await api.get(
            `/vendor/sellers/${sellerA.id}`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller).toBeDefined()
          const seller = response.data.seller
          expect(seller.id).toEqual(sellerA.id)
          expect(seller.name).toEqual("Alpha Store")
          expect(seller.handle).toEqual("alpha-store")
          expect(seller).toHaveProperty("email")
          expect(seller).toHaveProperty("description")
          expect(seller).toHaveProperty("logo")
          expect(seller).toHaveProperty("banner")
          expect(seller).toHaveProperty("website_url")
          expect(seller).toHaveProperty("external_id")
          expect(seller).toHaveProperty("currency_code")
          expect(seller).toHaveProperty("status")
          expect(seller).toHaveProperty("is_premium")
          expect(seller).toHaveProperty("closed_from")
          expect(seller).toHaveProperty("closed_to")
          expect(seller).toHaveProperty("metadata")
        })

        it("should return 404 for non-existent seller", async () => {
          const response = await api
            .get(`/vendor/sellers/sel_nonexistent`, headersA)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })

        it("should include nested address when set", async () => {
          await api.post(
            `/vendor/sellers/${sellerA.id}/address`,
            {
              first_name: "John",
              last_name: "Doe",
              address_1: "123 Main St",
              city: "New York",
              country_code: "us",
              postal_code: "10001",
            },
            headersA
          )

          const response = await api.get(
            `/vendor/sellers/${sellerA.id}`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.address).toBeDefined()
          expect(response.data.seller.address.city).toEqual("New York")
        })

        it("should include nested payment_details when set", async () => {
          await api.post(
            `/vendor/sellers/${sellerA.id}/payment-details`,
            {
              holder_name: "John Doe",
              iban: "DE89370400440532013000",
            },
            headersA
          )

          const response = await api.get(
            `/vendor/sellers/${sellerA.id}`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.payment_details).toBeDefined()
          expect(response.data.seller.payment_details.holder_name).toEqual(
            "John Doe"
          )
        })

        it("should include nested professional_details when set", async () => {
          await api.post(
            `/vendor/sellers/${sellerA.id}/professional-details`,
            {
              corporate_name: "Alpha Corp",
              tax_id: "TAX123",
            },
            headersA
          )

          const response = await api.get(
            `/vendor/sellers/${sellerA.id}`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.professional_details).toBeDefined()
          expect(
            response.data.seller.professional_details.corporate_name
          ).toEqual("Alpha Corp")
        })
      })

      describe("POST /vendor/sellers/:id", () => {
        it("should update name", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}`,
            { name: "Alpha Renamed" },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.name).toEqual("Alpha Renamed")
        })

        it("should update description", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}`,
            { description: "Updated description" },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.description).toEqual(
            "Updated description"
          )
        })

        it("should update logo with valid URL", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}`,
            { logo: "https://example.com/logo.png" },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.logo).toEqual(
            "https://example.com/logo.png"
          )
        })

        it("should update banner with valid URL", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}`,
            { banner: "https://example.com/banner.png" },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.banner).toEqual(
            "https://example.com/banner.png"
          )
        })

        it("should update website_url", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}`,
            { website_url: "https://alpha-store.com" },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.website_url).toEqual(
            "https://alpha-store.com"
          )
        })

        it("should set and clear closure dates", async () => {
          const now = new Date()
          const closedFrom = new Date(
            now.getTime() + 24 * 60 * 60 * 1000
          ).toISOString()
          const closedTo = new Date(
            now.getTime() + 48 * 60 * 60 * 1000
          ).toISOString()

          const setResponse = await api.post(
            `/vendor/sellers/${sellerA.id}`,
            { closed_from: closedFrom, closed_to: closedTo },
            headersA
          )

          expect(setResponse.status).toEqual(200)
          expect(setResponse.data.seller.closed_from).toBeDefined()
          expect(setResponse.data.seller.closed_to).toBeDefined()

          const clearResponse = await api.post(
            `/vendor/sellers/${sellerA.id}`,
            { closed_from: null, closed_to: null },
            headersA
          )

          expect(clearResponse.status).toEqual(200)
          expect(clearResponse.data.seller.closed_from).toBeNull()
          expect(clearResponse.data.seller.closed_to).toBeNull()
        })

        it("should update metadata", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}`,
            { metadata: { key: "value" } },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.metadata).toEqual({ key: "value" })
        })

        it("should not update restricted fields (email, currency_code, is_premium, status)", async () => {
          const before = await api.get(
            `/vendor/sellers/${sellerA.id}`,
            headersA
          )

          await api
            .post(
              `/vendor/sellers/${sellerA.id}`,
              {
                email: "hacked@test.com",
                currency_code: "eur",
                is_premium: true,
                status: "suspended",
              } as any,
              headersA
            )
            .catch(() => { })

          const after = await api.get(
            `/vendor/sellers/${sellerA.id}`,
            headersA
          )

          expect(after.data.seller.email).toEqual(before.data.seller.email)
          expect(after.data.seller.currency_code).toEqual(
            before.data.seller.currency_code
          )
          expect(after.data.seller.is_premium).toEqual(
            before.data.seller.is_premium
          )
          expect(after.data.seller.status).toEqual(before.data.seller.status)
        })

        it("should fail for invalid logo URL", async () => {
          const response = await api
            .post(
              `/vendor/sellers/${sellerA.id}`,
              { logo: "not-a-url" },
              headersA
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for invalid banner URL", async () => {
          const response = await api
            .post(
              `/vendor/sellers/${sellerA.id}`,
              { banner: "not-a-url" },
              headersA
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })
      })

      describe("POST /vendor/sellers/:id/address", () => {
        it("should create address with full fields", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/address`,
            {
              company: "Alpha Inc",
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
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.address).toEqual(
            expect.objectContaining({
              company: "Alpha Inc",
              first_name: "John",
              last_name: "Doe",
              address_1: "123 Main St",
              city: "New York",
              country_code: "us",
              postal_code: "10001",
            })
          )
        })

        it("should update existing address", async () => {
          await api.post(
            `/vendor/sellers/${sellerA.id}/address`,
            {
              first_name: "John",
              city: "New York",
            },
            headersA
          )

          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/address`,
            {
              first_name: "Jane",
              city: "Los Angeles",
            },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.address.first_name).toEqual("Jane")
          expect(response.data.seller.address.city).toEqual("Los Angeles")
        })

        it("should include nested address in response", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/address`,
            { city: "Chicago" },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller).toBeDefined()
          expect(response.data.seller.address).toBeDefined()
          expect(response.data.seller.address.city).toEqual("Chicago")
        })
      })

      describe("POST /vendor/sellers/:id/payment-details", () => {
        it("should create with IBAN fields", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/payment-details`,
            {
              holder_name: "John Doe",
              bank_name: "Deutsche Bank",
              iban: "DE89370400440532013000",
              bic: "COBADEFFXXX",
            },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.payment_details).toEqual(
            expect.objectContaining({
              holder_name: "John Doe",
              bank_name: "Deutsche Bank",
              iban: "DE89370400440532013000",
              bic: "COBADEFFXXX",
            })
          )
        })

        it("should create with routing/account fields", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/payment-details`,
            {
              holder_name: "Jane Smith",
              routing_number: "021000021",
              account_number: "123456789",
            },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.payment_details).toEqual(
            expect.objectContaining({
              holder_name: "Jane Smith",
              routing_number: "021000021",
              account_number: "123456789",
            })
          )
        })

        it("should update existing payment details", async () => {
          await api.post(
            `/vendor/sellers/${sellerA.id}/payment-details`,
            {
              holder_name: "John Doe",
              iban: "DE89370400440532013000",
            },
            headersA
          )

          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/payment-details`,
            {
              holder_name: "John Updated",
              iban: "GB29NWBK60161331926819",
            },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.payment_details.holder_name).toEqual(
            "John Updated"
          )
          expect(response.data.seller.payment_details.iban).toEqual(
            "GB29NWBK60161331926819"
          )
        })

        it("should include nested payment_details in response", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/payment-details`,
            { holder_name: "Test Holder" },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller).toBeDefined()
          expect(response.data.seller.payment_details).toBeDefined()
        })
      })

      describe("POST /vendor/sellers/:id/professional-details", () => {
        it("should create with corporate_name, registration_number, tax_id", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/professional-details`,
            {
              corporate_name: "Alpha Corporation",
              registration_number: "REG-12345",
              tax_id: "TAX-67890",
            },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.professional_details).toEqual(
            expect.objectContaining({
              corporate_name: "Alpha Corporation",
              registration_number: "REG-12345",
              tax_id: "TAX-67890",
            })
          )
        })

        it("should update existing professional details", async () => {
          await api.post(
            `/vendor/sellers/${sellerA.id}/professional-details`,
            {
              corporate_name: "Alpha Corp",
              tax_id: "TAX-111",
            },
            headersA
          )

          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/professional-details`,
            {
              corporate_name: "Alpha Corp Updated",
              tax_id: "TAX-222",
            },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.seller.professional_details.corporate_name
          ).toEqual("Alpha Corp Updated")
          expect(response.data.seller.professional_details.tax_id).toEqual(
            "TAX-222"
          )
        })

        it("should include nested professional_details in response", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/professional-details`,
            { corporate_name: "Test Corp" },
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller).toBeDefined()
          expect(response.data.seller.professional_details).toBeDefined()
        })
      })

      describe("GET /vendor/sellers/:id/members", () => {
        it("should list members with linked data", async () => {
          const response = await api.get(
            `/vendor/sellers/${sellerA.id}/members`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller_members).toBeDefined()
          expect(Array.isArray(response.data.seller_members)).toBe(true)
          expect(response.data.seller_members.length).toBeGreaterThanOrEqual(1)

          const sm = response.data.seller_members[0]
          expect(sm.member).toBeDefined()
        })

        it("should have owner member with is_owner true", async () => {
          const response = await api.get(
            `/vendor/sellers/${sellerA.id}/members`,
            headersA
          )

          expect(response.status).toEqual(200)
          const owner = response.data.seller_members.find(
            (sm: any) => sm.is_owner === true
          )
          expect(owner).toBeDefined()
        })

        it("should return pagination metadata", async () => {
          const response = await api.get(
            `/vendor/sellers/${sellerA.id}/members`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toBeDefined()
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })
      })

      describe("POST /vendor/sellers/:id/members", () => {
        it("should create invitation with email and role_id", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/members`,
            {
              email: "invite@test.com",
              role_id: SellerRole.SELLER_ADMINISTRATION,
            },
            headersA
          )

          expect(response.status).toEqual(201)
          expect(response.data.member_invite).toBeDefined()
          expect(response.data.member_invite.email).toEqual("invite@test.com")
          expect(response.data.member_invite.role_id).toEqual(SellerRole.SELLER_ADMINISTRATION)
        })

        it("should fail for invalid email format", async () => {
          const response = await api
            .post(
              `/vendor/sellers/${sellerA.id}/members`,
              {
                email: "not-an-email",
                role_id: SellerRole.SELLER_ADMINISTRATION,
              },
              headersA
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing email", async () => {
          const response = await api
            .post(
              `/vendor/sellers/${sellerA.id}/members`,
              {
                role_id: SellerRole.SELLER_ADMINISTRATION,
              },
              headersA
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for missing role_id", async () => {
          const response = await api
            .post(
              `/vendor/sellers/${sellerA.id}/members`,
              {
                email: "norole@test.com",
              },
              headersA
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail for invalid role_id", async () => {
          const response = await api
            .post(
              `/vendor/sellers/${sellerA.id}/members`,
              {
                email: "invalidrole@test.com",
                role_id: "invalid_role",
              },
              headersA
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })
      })

      describe("POST /vendor/sellers/:id/members/:member_id", () => {
        let sellerMemberBId: string

        beforeEach(async () => {
          // Add memberB to sellerA via admin
          const addResponse = await api.post(
            `/admin/sellers/${sellerA.id}/members`,
            {
              member_id: memberB.id,
              role_id: SellerRole.SELLER_ADMINISTRATION,
            },
            adminHeaders
          )
          sellerMemberBId = addResponse.data.seller_member.id
        })

        it("should update role on an existing seller_member", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/members/${sellerMemberBId}`,
            { role_id: SellerRole.ORDER_MANAGEMENT },
            headersA
          )

          expect(response.status).toEqual(200)
        })

        it("should fail for missing role_id", async () => {
          const response = await api
            .post(
              `/vendor/sellers/${sellerA.id}/members/${sellerMemberBId}`,
              {},
              headersA
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })
      })

      describe("DELETE /vendor/sellers/:id/members/:member_id", () => {
        let sellerMemberBId: string

        beforeEach(async () => {
          // Add memberB to sellerA via admin
          const addResponse = await api.post(
            `/admin/sellers/${sellerA.id}/members`,
            {
              member_id: memberB.id,
              role_id: SellerRole.SELLER_ADMINISTRATION,
            },
            adminHeaders
          )
          sellerMemberBId = addResponse.data.seller_member.id
        })

        it("should remove non-owner member", async () => {
          const response = await api.delete(
            `/vendor/sellers/${sellerA.id}/members/${sellerMemberBId}`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.id).toEqual(sellerMemberBId)
          expect(response.data.object).toEqual("seller_member")
          expect(response.data.deleted).toBe(true)
        })

        it("should fail when trying to remove owner member", async () => {
          // Get the owner seller_member id
          const membersResponse = await api.get(
            `/vendor/sellers/${sellerA.id}/members`,
            headersA
          )

          const ownerMember = membersResponse.data.seller_members.find(
            (sm: any) => sm.is_owner === true
          )

          const response = await api
            .delete(
              `/vendor/sellers/${sellerA.id}/members/${ownerMember.id}`,
              headersA
            )
            .catch((e) => e.response)

          expect(response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("GET /vendor/sellers/:id/members/me", () => {
        it("should return current authenticated member", async () => {
          const response = await api.get(
            `/vendor/sellers/${sellerA.id}/members/me`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller_member).toBeDefined()
          expect(response.data.seller_member.member).toBeDefined()
          expect(response.data.seller_member.is_owner).toBe(true)
        })

        it("should return member with default fields", async () => {
          const response = await api.get(
            `/vendor/sellers/${sellerA.id}/members/me`,
            headersA
          )

          expect(response.status).toEqual(200)
          const sm = response.data.seller_member
          expect(sm).toHaveProperty("id")
          expect(sm).toHaveProperty("is_owner")
          expect(sm).toHaveProperty("member")
          expect(sm).toHaveProperty("rbac_role")
        })

        it("should return different members for different users", async () => {
          const responseA = await api.get(
            `/vendor/sellers/${sellerA.id}/members/me`,
            headersA
          )

          // Add memberB to sellerA
          const addResponse = await api.post(
            `/admin/sellers/${sellerA.id}/members`,
            {
              member_id: memberB.id,
              role_id: SellerRole.SELLER_ADMINISTRATION,
            },
            adminHeaders
          )

          const headersB_sellerA = {
            headers: {
              ...headersB.headers,
              "x-seller-id": sellerA.id,
            },
          }

          const responseB = await api.get(
            `/vendor/sellers/${sellerA.id}/members/me`,
            headersB_sellerA
          )

          expect(responseA.data.seller_member.id).not.toEqual(
            responseB.data.seller_member.id
          )
          expect(responseA.data.seller_member.is_owner).toBe(true)
          expect(responseB.data.seller_member.is_owner).toBe(false)
        })
      })
    })
  },
})
