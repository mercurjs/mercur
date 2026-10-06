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
    describe("Auth - admin and vendor panels side by side", () => {
      let appContainer: MedusaContainer
      let sellerId: string
      let otherSellerId: string

      const login = async (actorType: "user" | "member", email: string) => {
        const response = await api.post(`/auth/${actorType}/emailpass`, {
          email,
          password: "somepassword",
        })

        return { headers: { authorization: `Bearer ${response.data.token}` } }
      }

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const result = await createSellerUser(appContainer, {
          email: "alpha@test.com",
          name: "Alpha Store",
        })
        sellerId = result.seller.id

        const other = await createSellerUser(appContainer, {
          email: "beta@test.com",
          name: "Beta Store",
        })
        otherSellerId = other.seller.id
      })

      it("keeps the admin authenticated after a vendor login", async () => {
        const admin = await login("user", "admin@medusa.js")

        const before = await api.get(`/admin/users/me`, admin)
        expect(before.status).toEqual(200)

        const member = await login("member", "alpha@test.com")

        const selected = await api.post(
          `/vendor/sellers/select`,
          { seller_id: sellerId },
          member
        )
        expect(selected.status).toEqual(200)
        expect(selected.data).toEqual({ success: true, seller_id: sellerId })
        expect(selected.headers["set-cookie"]).toBeUndefined()

        const me = await api.get(`/vendor/members/me`, {
          headers: { ...member.headers, "x-seller-id": sellerId },
        })
        expect(me.status).toEqual(200)

        const after = await api.get(`/admin/users/me`, admin)
        expect(after.status).toEqual(200)
        expect(after.data.user.email).toEqual("admin@medusa.js")
      })

      it("rejects selecting a seller the member does not belong to", async () => {
        const member = await login("member", "alpha@test.com")

        const response = await api
          .post(`/vendor/sellers/select`, { seller_id: otherSellerId }, member)
          .catch((e) => e.response)

        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual(
          "You are not a member of this seller account"
        )
      })
    })
  },
})
