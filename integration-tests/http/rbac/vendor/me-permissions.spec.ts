import { MedusaContainer } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { createSellerDefaultsWorkflow } from "@mercurjs/core/workflows"
import { SellerRole } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(90000)

const setMemberRole = async (
  container: MedusaContainer,
  sellerId: string,
  memberId: string,
  roleId: string | null
) => {
  const sellerModule: any = container.resolve("seller")

  const [sellerMember] = await sellerModule.listSellerMembers({
    seller_id: sellerId,
    member_id: memberId,
  })

  await sellerModule.updateSellerMembers({
    id: sellerMember.id,
    role_id: roleId,
  })
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("GET /vendor/rbac/me/permissions", () => {
      let appContainer: MedusaContainer
      let seller: any
      let member: any
      let headers: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createSellerDefaultsWorkflow(appContainer).run()
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const result = await createSellerUser(appContainer, {
          email: "rbac-me@test.com",
          name: "RBAC Me Store",
        })

        seller = result.seller
        member = result.member
        headers = result.headers
      })

      it("returns expanded permissions for the administration role", async () => {
        const response = await api.get("/vendor/rbac/me/permissions", headers)

        expect(response.status).toEqual(200)
        expect(Array.isArray(response.data.permissions)).toBe(true)
        expect(response.data.permissions).toEqual(
          expect.arrayContaining(["product:read", "order:read", "offer:create"])
        )
      })

      it("returns no wildcard entries", async () => {
        const response = await api.get("/vendor/rbac/me/permissions", headers)

        for (const permission of response.data.permissions) {
          expect(permission).not.toContain("*")
        }
      })

      it("narrows to what a restricted role grants", async () => {
        await setMemberRole(
          appContainer,
          seller.id,
          member.id,
          SellerRole.SUPPORT
        )

        const response = await api.get("/vendor/rbac/me/permissions", headers)

        expect(response.status).toEqual(200)
        expect(response.data.permissions).toEqual(
          expect.arrayContaining(["order:read", "review:read"])
        )
        // Support cannot touch the catalog or billing.
        expect(response.data.permissions).not.toContain("product:create")
        expect(response.data.permissions).not.toContain("payout:read")
      })

      it("is scoped to the seller the request acts on", async () => {
        await setMemberRole(
          appContainer,
          seller.id,
          member.id,
          SellerRole.ACCOUNTING
        )

        const response = await api.get("/vendor/rbac/me/permissions", headers)

        expect(response.data.permissions).toEqual(
          expect.arrayContaining(["payout:read", "payout_account:update"])
        )
        expect(response.data.permissions).not.toContain("product:create")
      })
    })
  },
})
