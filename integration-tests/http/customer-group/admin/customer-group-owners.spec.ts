import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Customer Group Owners", () => {
      let appContainer: MedusaContainer
      let seller1Headers: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const seller1Result = await createSellerUser(appContainer, {
          email: "seller1@test.com",
          name: "Test Seller 1",
        })
        seller1Headers = { headers: { ...seller1Result.headers.headers } }
      })

      it("returns the owning seller for a seller-created group", async () => {
        const created = await api.post(
          "/vendor/customer-groups",
          { name: "VIP" },
          seller1Headers
        )
        const groupId = created.data.customer_group.id

        const res = await api.get(
          `/admin/customer-groups/owners?group_ids=${groupId}`,
          adminHeaders
        )

        expect(res.status).toEqual(200)
        expect(res.data.owners).toHaveLength(1)
        expect(res.data.owners[0]).toEqual(
          expect.objectContaining({
            customer_group_id: groupId,
            seller_name: "Test Seller 1",
          })
        )
      })

      it("omits platform-owned groups (no seller link)", async () => {
        const sellerGroup = await api.post(
          "/vendor/customer-groups",
          { name: "Seller Group" },
          seller1Headers
        )
        const sellerGroupId = sellerGroup.data.customer_group.id

        const platformGroup = await api.post(
          "/admin/customer-groups",
          { name: "Platform Group" },
          adminHeaders
        )
        const platformGroupId = platformGroup.data.customer_group.id

        const res = await api.get(
          `/admin/customer-groups/owners?group_ids=${sellerGroupId},${platformGroupId}`,
          adminHeaders
        )

        expect(res.status).toEqual(200)
        const ids = res.data.owners.map((o: any) => o.customer_group_id)
        expect(ids).toContain(sellerGroupId)
        expect(ids).not.toContain(platformGroupId)
      })
    })
  },
})
