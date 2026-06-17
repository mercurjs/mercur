import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Customer Groups", () => {
      let appContainer: MedusaContainer
      let seller1: any
      let seller1Headers: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const seller1Result = await createSellerUser(appContainer, {
          email: "seller1@test.com",
          name: "ACME",
        })
        seller1 = seller1Result.seller
        seller1Headers = { headers: { ...seller1Result.headers.headers } }
      })

      describe("owning seller exposure", () => {
        it("exposes the owning seller on the detail endpoint", async () => {
          const created = await api.post(
            `/vendor/customer-groups`,
            { name: "B2B" },
            seller1Headers
          )
          const groupId = created.data.customer_group.id

          const res = await api.get(
            `/admin/customer-groups/${groupId}`,
            { ...adminHeaders, params: { fields: "+seller.id,+seller.name" } }
          )

          expect(res.status).toEqual(200)
          expect(res.data.customer_group.seller).toEqual(
            expect.objectContaining({ id: seller1.id, name: "ACME" })
          )
        })

        it("exposes the owning seller on the list endpoint", async () => {
          const created = await api.post(
            `/vendor/customer-groups`,
            { name: "B2B" },
            seller1Headers
          )
          const groupId = created.data.customer_group.id

          const res = await api.get(`/admin/customer-groups`, {
            ...adminHeaders,
            params: { fields: "+seller.id,+seller.name" },
          })

          expect(res.status).toEqual(200)
          const found = res.data.customer_groups.find(
            (g: any) => g.id === groupId
          )
          expect(found?.seller).toEqual(
            expect.objectContaining({ id: seller1.id, name: "ACME" })
          )
        })

        it("returns no owner for a platform-created group", async () => {
          const created = await api.post(
            `/admin/customer-groups`,
            { name: "Platform Group" },
            adminHeaders
          )
          const groupId = created.data.customer_group.id

          const res = await api.get(
            `/admin/customer-groups/${groupId}`,
            { ...adminHeaders, params: { fields: "+seller.id,+seller.name" } }
          )

          expect(res.status).toEqual(200)
          expect(res.data.customer_group.seller).toBeFalsy()
        })
      })

      describe("filtering by owner (seller_id)", () => {
        it("returns only groups owned by the given seller", async () => {
          const seller2Result = await createSellerUser(appContainer, {
            email: "seller2@test.com",
            name: "Globex",
          })
          const seller2Headers = {
            headers: { ...seller2Result.headers.headers },
          }

          const group1 = await api.post(
            `/vendor/customer-groups`,
            { name: "ACME Group" },
            seller1Headers
          )
          await api.post(
            `/vendor/customer-groups`,
            { name: "Globex Group" },
            seller2Headers
          )

          const res = await api.get(`/admin/customer-groups`, {
            ...adminHeaders,
            params: {
              seller_id: seller1.id,
              fields: "+seller.id,+seller.name",
            },
          })

          expect(res.status).toEqual(200)
          expect(res.data.customer_groups).toHaveLength(1)
          expect(res.data.customer_groups[0]).toEqual(
            expect.objectContaining({
              id: group1.data.customer_group.id,
              name: "ACME Group",
            })
          )
          expect(res.data.customer_groups[0].seller).toEqual(
            expect.objectContaining({ id: seller1.id, name: "ACME" })
          )
        })
      })
    })
  },
})
