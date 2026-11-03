import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SellerRole } from "@mercurjs/types"
import { createHash } from "node:crypto"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor - member invites and membership binding", () => {
      let appContainer: MedusaContainer
      let sellerA: any
      let sellerB: any
      let memberB: any
      let headersA: any
      let headersB: any

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const resultA = await createSellerUser(appContainer, {
          email: "alpha@test.com",
          name: "Alpha Store",
        })
        sellerA = resultA.seller
        headersA = resultA.headers

        const resultB = await createSellerUser(appContainer, {
          email: "beta@test.com",
          name: "Beta Store",
        })
        sellerB = resultB.seller
        memberB = resultB.member
        headersB = resultB.headers
      })

      const registerIdentity = async (email: string) => {
        const { data } = await api.post(`/auth/member/emailpass/register`, {
          email,
          password: "somepassword",
        })

        return { authorization: `Bearer ${data.token}` }
      }

      const invite = async (
        email: string,
        role: SellerRole = SellerRole.ORDER_MANAGEMENT
      ) => {
        const response = await api.post(
          `/vendor/sellers/${sellerA.id}/members`,
          { email, role_id: role },
          headersA
        )

        expect(response.status).toEqual(201)
        return response.data.member_invite
      }

      const loadInviteRow = async (id: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const {
          data: [row],
        } = await query.graph({
          entity: "member_invite",
          fields: ["id", "token_hash", "accepted"],
          filters: { id },
        })
        return row
      }

      describe("invite tokens", () => {
        it("returns the raw token only on creation and stores its hash", async () => {
          const created = await invite("new-invitee@test.com")

          expect(typeof created.token).toEqual("string")
          expect(created.token_hash).toBeUndefined()

          const row = await loadInviteRow(created.id)
          expect(row.token_hash).toEqual(
            createHash("sha256").update(created.token).digest("hex")
          )
          expect(row.token_hash).not.toEqual(created.token)
        })

        it("does not expose tokens on the vendor invite list", async () => {
          await invite("listed-invitee@test.com")

          const response = await api.get(
            `/vendor/sellers/${sellerA.id}/members/invites`,
            headersA
          )

          expect(response.status).toEqual(200)
          expect(response.data.member_invites).toHaveLength(1)
          expect(response.data.member_invites[0].token).toBeUndefined()
          expect(response.data.member_invites[0].token_hash).toBeUndefined()
        })

        it("does not expose tokens on the admin invite list", async () => {
          await invite("admin-listed@test.com")

          const response = await api.get(
            `/admin/sellers/${sellerA.id}/members/invites`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.member_invites).toHaveLength(1)
          expect(response.data.member_invites[0].token).toBeUndefined()
          expect(response.data.member_invites[0].token_hash).toBeUndefined()
        })

        it("returns a fresh raw token when an invite is resent", async () => {
          const created = await invite("resent@test.com")

          const response = await api.post(
            `/admin/sellers/${sellerA.id}/members/invites/${created.id}/resend`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(typeof response.data.member_invite.token).toEqual("string")
          expect(response.data.member_invite.token).not.toEqual(created.token)
          expect(response.data.member_invite.token_hash).toBeUndefined()

          const headers = await registerIdentity("resent@test.com")
          const stale = await api
            .post(
              `/vendor/members/invites/accept`,
              { invite_token: created.token },
              { headers }
            )
            .catch((e) => e.response)

          expect(stale.status).toEqual(400)
        })
      })

      describe("POST /vendor/members/invites/accept", () => {
        it("creates a member and binds the new identity", async () => {
          const created = await invite("fresh@test.com")
          const headers = await registerIdentity("fresh@test.com")

          const response = await api.post(
            `/vendor/members/invites/accept`,
            { invite_token: created.token, first_name: "Fresh" },
            { headers }
          )

          expect(response.status).toEqual(200)
          expect(response.data.member.email).toEqual("fresh@test.com")

          const row = await loadInviteRow(created.id)
          expect(row).toBeUndefined()

          const me = await api.get(`/vendor/sellers`, {
            headers: { ...headers, "x-seller-id": sellerA.id },
          })
          expect(me.status).toEqual(200)
          expect(me.data.seller_members).toHaveLength(1)
          expect(me.data.seller_members[0].seller_id).toEqual(sellerA.id)
        })

        it("lets an existing member join a second store when signed in", async () => {
          const created = await invite("beta@test.com")

          const response = await api.post(
            `/vendor/members/invites/accept`,
            { invite_token: created.token },
            { headers: { authorization: headersB.headers.authorization } }
          )

          expect(response.status).toEqual(200)
          expect(response.data.member.id).toEqual(memberB.id)

          const stores = await api.get(`/vendor/sellers`, headersB)
          expect(
            stores.data.seller_members.map((sm: any) => sm.seller_id).sort()
          ).toEqual([sellerA.id, sellerB.id].sort())
        })

        it("rejects a new identity redeeming an invite for an existing member's email", async () => {
          const created = await invite("beta@test.com")
          const headers = await registerIdentity("attacker@test.com")

          const response = await api
            .post(
              `/vendor/members/invites/accept`,
              { invite_token: created.token },
              { headers }
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(409)

          const stores = await api.get(`/vendor/sellers`, headersB)
          expect(stores.data.seller_members).toHaveLength(1)
          expect(stores.data.seller_members[0].seller_id).toEqual(sellerB.id)
        })

        it("rejects a signed-in member redeeming an invite issued to another email", async () => {
          const created = await invite("someone-else@test.com")

          const response = await api
            .post(
              `/vendor/members/invites/accept`,
              { invite_token: created.token },
              { headers: { authorization: headersB.headers.authorization } }
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)

          const row = await loadInviteRow(created.id)
          expect(row.accepted).toEqual(false)
        })
      })

      describe("POST /vendor/sellers with an existing member email", () => {
        it("rejects a new identity creating a store on another member's email", async () => {
          const headers = await registerIdentity("hijack@test.com")

          const response = await api
            .post(
              `/vendor/sellers`,
              {
                name: "Hijack Store",
                email: "hijack-store@test.com",
                member_email: "beta@test.com",
                currency_code: "usd",
              },
              { headers }
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(409)

          const stores = await api.get(`/vendor/sellers`, headersB)
          expect(stores.data.seller_members).toHaveLength(1)
        })

        it("still lets a signed-in member create a second store", async () => {
          const response = await api.post(
            `/vendor/sellers`,
            {
              name: "Beta Second",
              email: "beta-second@test.com",
              member_email: "beta@test.com",
              currency_code: "usd",
            },
            { headers: { authorization: headersB.headers.authorization } }
          )

          expect(response.status).toEqual(201)

          const stores = await api.get(`/vendor/sellers`, headersB)
          expect(stores.data.seller_members).toHaveLength(2)
        })
      })

      describe("POST /vendor/sellers/:id/members/:member_id role changes", () => {
        let sellerMemberBInA: string

        const headersBInA = () => ({
          headers: {
            authorization: headersB.headers.authorization,
            "x-seller-id": sellerA.id,
          },
        })

        beforeEach(async () => {
          const response = await api.post(
            `/admin/sellers/${sellerA.id}/members`,
            { member_id: memberB.id, role_id: SellerRole.ORDER_MANAGEMENT },
            adminHeaders
          )
          sellerMemberBInA = response.data.seller_member.id
        })

        it("rejects a member changing their own role", async () => {
          const response = await api
            .post(
              `/vendor/sellers/${sellerA.id}/members/${sellerMemberBInA}`,
              { role_id: SellerRole.SELLER_ADMINISTRATION },
              headersBInA()
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)

          const members = await api.get(
            `/vendor/sellers/${sellerA.id}/members`,
            headersA
          )
          const target = members.data.seller_members.find(
            (sm: any) => sm.id === sellerMemberBInA
          )
          expect(target.role_id).toEqual(SellerRole.ORDER_MANAGEMENT)
        })

        it("rejects a non-administrator granting the administration role", async () => {
          const created = await invite("third@test.com", SellerRole.SUPPORT)
          const thirdHeaders = await registerIdentity("third@test.com")
          const accepted = await api.post(
            `/vendor/members/invites/accept`,
            { invite_token: created.token },
            { headers: thirdHeaders }
          )
          expect(accepted.status).toEqual(200)

          const members = await api.get(
            `/vendor/sellers/${sellerA.id}/members`,
            headersA
          )
          const third = members.data.seller_members.find(
            (sm: any) => sm.member_id === accepted.data.member.id
          )

          const response = await api
            .post(
              `/vendor/sellers/${sellerA.id}/members/${third.id}`,
              { role_id: SellerRole.SELLER_ADMINISTRATION },
              headersBInA()
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("lets an administrator grant the administration role to another member", async () => {
          const response = await api.post(
            `/vendor/sellers/${sellerA.id}/members/${sellerMemberBInA}`,
            { role_id: SellerRole.SELLER_ADMINISTRATION },
            headersA
          )

          expect(response.status).toEqual(200)
        })
      })
    })
  },
})
