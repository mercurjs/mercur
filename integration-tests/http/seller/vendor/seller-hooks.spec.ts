import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  acceptMemberInviteWorkflow,
  createSellerAccountWorkflow,
} from "@mercurjs/core/workflows"
import { SellerRole } from "@mercurjs/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

// A workflow hook accepts a single handler, so each one is registered once
// and the tests toggle its behaviour through these variables.
let rejectSignup = false
let rejectInvite = false
let createdPayload: { seller_id: string; member_id?: string } | null = null
let acceptedPayload: {
  member_id: string
  seller_id: string
  additional_data?: Record<string, unknown>
} | null = null

createSellerAccountWorkflow.hooks.validate(() => {
  if (rejectSignup) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Signup rejected by plugin"
    )
  }
})

createSellerAccountWorkflow.hooks.sellerAccountCreated(
  ({ seller, member_id }) => {
    createdPayload = { seller_id: seller.id, member_id }
    return new StepResponse(undefined)
  }
)

acceptMemberInviteWorkflow.hooks.validate(() => {
  if (rejectInvite) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Invite rejected by plugin"
    )
  }
})

acceptMemberInviteWorkflow.hooks.memberInviteAccepted(
  ({ member, invite, additional_data }) => {
    acceptedPayload = {
      member_id: member.id,
      seller_id: invite.seller_id,
      additional_data: additional_data as Record<string, unknown> | undefined,
    }
    return new StepResponse(undefined)
  }
)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor - registration and invitation hooks", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        rejectSignup = false
        rejectInvite = false
        createdPayload = null
        acceptedPayload = null
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      const registerIdentity = async (email: string) => {
        const { data } = await api.post(`/auth/member/emailpass/register`, {
          email,
          password: "somepassword",
        })

        return { authorization: `Bearer ${data.token}` }
      }

      const countRows = async (entity: string, filters: object) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity,
          fields: ["id"],
          filters,
        })
        return data.length
      }

      describe("POST /vendor/sellers", () => {
        it("creates the seller and passes the new member id to sellerAccountCreated", async () => {
          const headers = await registerIdentity("fresh@test.com")

          const response = await api.post(
            `/vendor/sellers`,
            {
              name: "Fresh Store",
              email: "fresh-store@test.com",
              member_email: "fresh@test.com",
              currency_code: "usd",
            },
            { headers }
          )

          expect(response.status).toEqual(201)

          const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
          const {
            data: [member],
          } = await query.graph({
            entity: "member",
            fields: ["id"],
            filters: { email: "fresh@test.com" },
          })

          expect(createdPayload).toEqual({
            seller_id: response.data.seller.id,
            member_id: member.id,
          })
        })

        it("passes the existing member id when a member creates a second store", async () => {
          const { member, headers } = await createSellerUser(appContainer, {
            email: "owner@test.com",
            name: "First Store",
          })

          const response = await api.post(
            `/vendor/sellers`,
            {
              name: "Second Store",
              email: "second-store@test.com",
              currency_code: "usd",
            },
            headers
          )

          expect(response.status).toEqual(201)
          expect(createdPayload).toEqual({
            seller_id: response.data.seller.id,
            member_id: member.id,
          })
        })

        it("rejects the signup before anything is written when validate throws", async () => {
          rejectSignup = true
          const headers = await registerIdentity("rejected@test.com")

          const response = await api
            .post(
              `/vendor/sellers`,
              {
                name: "Rejected Store",
                email: "rejected-store@test.com",
                member_email: "rejected@test.com",
                currency_code: "usd",
              },
              { headers }
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
          expect(response.data.message).toContain("Signup rejected by plugin")
          expect(createdPayload).toBeNull()
          expect(
            await countRows("seller", { email: "rejected-store@test.com" })
          ).toEqual(0)
          expect(
            await countRows("member", { email: "rejected@test.com" })
          ).toEqual(0)
        })
      })

      describe("POST /vendor/members/invites/accept", () => {
        const inviteMember = async (email: string) => {
          const owner = await createSellerUser(appContainer, {
            email: `owner-${email}`,
            name: "Inviting Store",
          })

          await api.post(
            `/vendor/sellers/${owner.seller.id}/members`,
            { email, role_id: SellerRole.SELLER_ADMINISTRATION },
            owner.headers
          )

          const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
          const {
            data: [invite],
          } = await query.graph({
            entity: "member_invite",
            fields: ["id", "token"],
            filters: { email },
          })

          return { seller: owner.seller, invite }
        }

        it("accepts the invite and passes additional_data to memberInviteAccepted", async () => {
          const { seller, invite } = await inviteMember("invitee@test.com")
          const headers = await registerIdentity("invitee@test.com")

          const response = await api.post(
            `/vendor/members/invites/accept`,
            {
              invite_token: invite.token,
              first_name: "Invited",
              additional_data: { accepted_terms: true },
            },
            { headers }
          )

          expect(response.status).toEqual(200)
          expect(acceptedPayload).toEqual({
            member_id: response.data.member.id,
            seller_id: seller.id,
            additional_data: { accepted_terms: true },
          })
        })

        it("accepts a body without additional_data", async () => {
          const { invite } = await inviteMember("plain@test.com")
          const headers = await registerIdentity("plain@test.com")

          const response = await api.post(
            `/vendor/members/invites/accept`,
            { invite_token: invite.token },
            { headers }
          )

          expect(response.status).toEqual(200)
          expect(response.data.member.email).toEqual("plain@test.com")
        })

        it("leaves the invite unaccepted when validate throws", async () => {
          rejectInvite = true
          const { seller, invite } = await inviteMember("blocked@test.com")
          const headers = await registerIdentity("blocked@test.com")

          const response = await api
            .post(
              `/vendor/members/invites/accept`,
              { invite_token: invite.token },
              { headers }
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
          expect(response.data.message).toContain("Invite rejected by plugin")
          expect(acceptedPayload).toBeNull()
          expect(await countRows("member_invite", { id: invite.id })).toEqual(1)
          expect(
            await countRows("member", { email: "blocked@test.com" })
          ).toEqual(0)

          const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
          const { data: sellerMembers } = await query.graph({
            entity: "seller_member",
            fields: ["id"],
            filters: { seller_id: seller.id },
          })
          expect(sellerMembers).toHaveLength(1)
        })
      })
    })
  },
})
