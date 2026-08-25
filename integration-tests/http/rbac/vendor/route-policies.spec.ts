import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { createSellerDefaultsWorkflow } from "@mercurjs/core/workflows"
import { SellerRole } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(90000)

/**
 * Re-points the acting member at a different role. Roles are resolved per
 * request from the seller_member row, so no new token is needed.
 */
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
    describe("RBAC - vendor route policies", () => {
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
          email: "rbac-seller@test.com",
          name: "RBAC Store",
        })

        seller = result.seller
        member = result.member
        headers = result.headers
      })

      describe("seller administration", () => {
        it("reaches routes across every domain", async () => {
          const orders = await api.get("/vendor/orders", headers)
          expect(orders.status).toEqual(200)

          const products = await api.get("/vendor/products", headers)
          expect(products.status).toEqual(200)

          const payoutAccount = await api.get(
            "/vendor/payout-accounts",
            headers
          )
          expect([200, 404]).toContain(payoutAccount.status)
        })
      })

      describe("a role without the required policy", () => {
        beforeEach(async () => {
          await setMemberRole(
            appContainer,
            seller.id,
            member.id,
            SellerRole.SUPPORT
          )
        })

        it("allows a read the role does hold", async () => {
          const response = await api.get("/vendor/orders", headers)
          expect(response.status).toEqual(200)
        })

        it("rejects a write the role does not hold", async () => {
          const response = await api
            .post("/vendor/products", { title: "Blocked" }, headers)
            .catch((e) => e.response)

          expect(response.status).toEqual(403)
        })

        it("rejects a read on a domain the role does not hold", async () => {
          const response = await api
            .get("/vendor/price-lists", headers)
            .catch((e) => e.response)

          expect(response.status).toEqual(403)
        })
      })

      describe("inventory management", () => {
        beforeEach(async () => {
          await setMemberRole(
            appContainer,
            seller.id,
            member.id,
            SellerRole.INVENTORY_MANAGEMENT
          )
        })

        it("reaches the catalog", async () => {
          const response = await api.get("/vendor/products", headers)
          expect(response.status).toEqual(200)
        })

        it("does not reach payouts", async () => {
          const response = await api
            .get("/vendor/payouts", headers)
            .catch((e) => e.response)

          expect(response.status).toEqual(403)
        })
      })

      describe("a member with no role", () => {
        beforeEach(async () => {
          await setMemberRole(appContainer, seller.id, member.id, null)
        })

        // Route policy checks reject an actor with an empty role list, so
        // without the administration fallback these members would be locked
        // out of their own store entirely.
        it("is not locked out", async () => {
          const response = await api.get("/vendor/products", headers)
          expect(response.status).toEqual(200)
        })
      })

      describe("every member can read its own membership", () => {
        it.each([
          SellerRole.INVENTORY_MANAGEMENT,
          SellerRole.ORDER_MANAGEMENT,
          SellerRole.ACCOUNTING,
          SellerRole.SUPPORT,
        ])("resolves /vendor/members/me as %s", async (role) => {
          await setMemberRole(appContainer, seller.id, member.id, role)

          const response = await api.get("/vendor/members/me", headers)
          expect(response.status).toEqual(200)
        })
      })

      describe("default roles", () => {
        it("binds policies to every seeded role", async () => {
          const rbac: any = appContainer.resolve(Modules.RBAC)

          const rolePolicies = await rbac.listRbacRolePolicies({
            role_id: [
              SellerRole.INVENTORY_MANAGEMENT,
              SellerRole.ORDER_MANAGEMENT,
              SellerRole.ACCOUNTING,
              SellerRole.SUPPORT,
            ],
          })

          const byRole = new Map<string, number>()
          for (const rolePolicy of rolePolicies) {
            byRole.set(
              rolePolicy.role_id,
              (byRole.get(rolePolicy.role_id) ?? 0) + 1
            )
          }

          expect(byRole.get(SellerRole.INVENTORY_MANAGEMENT)).toBeGreaterThan(0)
          expect(byRole.get(SellerRole.ORDER_MANAGEMENT)).toBeGreaterThan(0)
          expect(byRole.get(SellerRole.ACCOUNTING)).toBeGreaterThan(0)
          expect(byRole.get(SellerRole.SUPPORT)).toBeGreaterThan(0)
        })
      })
    })
  },
})
