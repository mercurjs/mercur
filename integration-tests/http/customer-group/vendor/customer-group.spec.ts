import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Customer Groups", () => {
      let appContainer: MedusaContainer
      let seller1Headers: any
      let seller2Headers: any
      let seller1: any
      let customer1: any
      let customer2: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const seller1Result = await createSellerUser(appContainer, {
          email: "seller1@test.com",
          name: "Test Seller 1",
        })
        seller1 = seller1Result.seller
        // headers are mutated/shared by the helper, so snapshot them
        seller1Headers = { headers: { ...seller1Result.headers.headers } }

        const seller2Result = await createSellerUser(appContainer, {
          email: "seller2@test.com",
          name: "Test Seller 2",
        })
        seller2Headers = { headers: { ...seller2Result.headers.headers } }

        const customer1Result = await createCustomerUser(appContainer, {
          email: "customer1@test.com",
          first_name: "Customer",
          last_name: "One",
        })
        customer1 = customer1Result.customer

        const customer2Result = await createCustomerUser(appContainer, {
          email: "customer2@test.com",
          first_name: "Customer",
          last_name: "Two",
        })
        customer2 = customer2Result.customer
      })

      const createGroup = async (headers: any, name: string) => {
        const res = await api.post(`/vendor/customer-groups`, { name }, headers)
        return res.data.customer_group
      }

      describe("POST /vendor/customer-groups", () => {
        it("creates a customer group owned by the seller", async () => {
          const res = await api.post(
            `/vendor/customer-groups`,
            { name: "VIP" },
            seller1Headers
          )

          expect(res.status).toEqual(200)
          expect(res.data.customer_group).toEqual(
            expect.objectContaining({ name: "VIP" })
          )

          // The customer_group_seller link row exists
          const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
          const { data } = await query.graph({
            entity: "customer_group_seller",
            fields: ["seller_id", "customer_group_id"],
            filters: {
              seller_id: seller1.id,
              customer_group_id: res.data.customer_group.id,
            },
          })
          expect(data).toHaveLength(1)
        })
      })

      describe("GET /vendor/customer-groups", () => {
        it("lists only the seller's own groups", async () => {
          await createGroup(seller1Headers, "Seller1 Group")
          await createGroup(seller2Headers, "Seller2 Group")

          const res = await api.get(`/vendor/customer-groups`, seller1Headers)

          expect(res.status).toEqual(200)
          expect(res.data.customer_groups).toHaveLength(1)
          expect(res.data.customer_groups[0].name).toEqual("Seller1 Group")
        })
      })

      describe("GET /vendor/customer-groups/:id", () => {
        it("returns the seller's own group", async () => {
          const group = await createGroup(seller1Headers, "Mine")

          const res = await api.get(
            `/vendor/customer-groups/${group.id}`,
            seller1Headers
          )

          expect(res.status).toEqual(200)
          expect(res.data.customer_group.id).toEqual(group.id)
        })

        it("returns 404 for another seller's group", async () => {
          const group = await createGroup(seller1Headers, "Mine")

          const res = await api
            .get(`/vendor/customer-groups/${group.id}`, seller2Headers)
            .catch((e) => e.response)

          expect(res.status).toEqual(404)
        })
      })

      describe("POST /vendor/customer-groups/:id", () => {
        it("updates the seller's own group", async () => {
          const group = await createGroup(seller1Headers, "Old")

          const res = await api.post(
            `/vendor/customer-groups/${group.id}`,
            { name: "New" },
            seller1Headers
          )

          expect(res.status).toEqual(200)
          expect(res.data.customer_group.name).toEqual("New")
        })

        it("returns 404 updating another seller's group", async () => {
          const group = await createGroup(seller1Headers, "Old")

          const res = await api
            .post(
              `/vendor/customer-groups/${group.id}`,
              { name: "Hacked" },
              seller2Headers
            )
            .catch((e) => e.response)

          expect(res.status).toEqual(404)
        })
      })

      describe("DELETE /vendor/customer-groups/:id", () => {
        it("deletes the seller's own group", async () => {
          const group = await createGroup(seller1Headers, "Doomed")

          const res = await api.delete(
            `/vendor/customer-groups/${group.id}`,
            seller1Headers
          )

          expect(res.status).toEqual(200)
          expect(res.data).toEqual(
            expect.objectContaining({ id: group.id, deleted: true })
          )
        })

        it("returns 404 deleting another seller's group", async () => {
          const group = await createGroup(seller1Headers, "Doomed")

          const res = await api
            .delete(`/vendor/customer-groups/${group.id}`, seller2Headers)
            .catch((e) => e.response)

          expect(res.status).toEqual(404)
        })
      })

      describe("POST /vendor/customer-groups/:id/customers", () => {
        it("adds and removes members of the seller's group", async () => {
          const group = await createGroup(seller1Headers, "Members")

          const addRes = await api.post(
            `/vendor/customer-groups/${group.id}/customers`,
            { add: [customer1.id, customer2.id] },
            seller1Headers
          )
          expect(addRes.status).toEqual(200)

          const afterAdd = await api.get(
            `/vendor/customer-groups/${group.id}?fields=id,customers.id`,
            seller1Headers
          )
          expect(afterAdd.data.customer_group.customers).toHaveLength(2)

          const removeRes = await api.post(
            `/vendor/customer-groups/${group.id}/customers`,
            { remove: [customer2.id] },
            seller1Headers
          )
          expect(removeRes.status).toEqual(200)

          const afterRemove = await api.get(
            `/vendor/customer-groups/${group.id}?fields=id,customers.id`,
            seller1Headers
          )
          expect(afterRemove.data.customer_group.customers).toHaveLength(1)
          expect(afterRemove.data.customer_group.customers[0].id).toEqual(
            customer1.id
          )
        })

        it("returns 404 managing members of another seller's group", async () => {
          const group = await createGroup(seller1Headers, "Members")

          const res = await api
            .post(
              `/vendor/customer-groups/${group.id}/customers`,
              { add: [customer1.id] },
              seller2Headers
            )
            .catch((e) => e.response)

          expect(res.status).toEqual(404)
        })
      })

      describe("POST /vendor/customers/:id/customer-groups", () => {
        it("manages a customer's group membership when seller owns both", async () => {
          // Link the customer to seller1 (normally created when the customer orders)
          const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
          await link.create({
            [MercurModules.SELLER]: { seller_id: seller1.id },
            [Modules.CUSTOMER]: { customer_id: customer1.id },
          })

          const group = await createGroup(seller1Headers, "Target")

          const res = await api.post(
            `/vendor/customers/${customer1.id}/customer-groups`,
            { add: [group.id] },
            seller1Headers
          )

          expect(res.status).toEqual(200)

          const check = await api.get(
            `/vendor/customer-groups/${group.id}?fields=id,customers.id`,
            seller1Headers
          )
          expect(
            check.data.customer_group.customers.map((c: any) => c.id)
          ).toContain(customer1.id)
        })

        it("returns 404 when the seller does not own the customer", async () => {
          const group = await createGroup(seller1Headers, "Target")

          const res = await api
            .post(
              `/vendor/customers/${customer1.id}/customer-groups`,
              { add: [group.id] },
              seller1Headers
            )
            .catch((e) => e.response)

          expect(res.status).toEqual(404)
        })
      })

      describe("Customer detail groups + counts", () => {
        it("exposes the customer's groups and a per-group customer count", async () => {
          const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
          await link.create({
            [MercurModules.SELLER]: { seller_id: seller1.id },
            [Modules.CUSTOMER]: { customer_id: customer1.id },
          })

          const group = await createGroup(seller1Headers, "VIP")
          await api.post(
            `/vendor/customer-groups/${group.id}/customers`,
            { add: [customer1.id, customer2.id] },
            seller1Headers
          )

          // Customer detail carries the customer's groups (drives the section)
          const detail = await api.get(
            `/vendor/customers/${customer1.id}`,
            seller1Headers
          )
          expect(detail.status).toEqual(200)
          const target = detail.data.customer.groups.find(
            (g: any) => g.id === group.id
          )
          expect(target).toBeTruthy()
          expect(target.name).toEqual("VIP")

          // The count column resolves via the groups list filtered by id
          const list = await api.get(
            `/vendor/customer-groups?id=${group.id}&fields=id,customers.id`,
            seller1Headers
          )
          expect(list.data.customer_groups[0].customers).toHaveLength(2)
        })

        it("does not expose groups owned by other sellers", async () => {
          const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
          // customer1 is known to both sellers
          await link.create({
            [MercurModules.SELLER]: { seller_id: seller1.id },
            [Modules.CUSTOMER]: { customer_id: customer1.id },
          })

          const ownGroup = await createGroup(seller1Headers, "Seller1 VIP")
          const otherGroup = await createGroup(seller2Headers, "Seller2 VIP")

          await api.post(
            `/vendor/customer-groups/${ownGroup.id}/customers`,
            { add: [customer1.id] },
            seller1Headers
          )
          await api.post(
            `/vendor/customer-groups/${otherGroup.id}/customers`,
            { add: [customer1.id] },
            seller2Headers
          )

          const res = await api.get(
            `/vendor/customers/${customer1.id}`,
            seller1Headers
          )

          const ids = res.data.customer.groups.map((g: any) => g.id)
          expect(ids).toContain(ownGroup.id)
          expect(ids).not.toContain(otherGroup.id)
        })
      })
    })
  },
})
