import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Customer Addresses", () => {
      let appContainer: MedusaContainer
      let customerId: string

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const { customer } = await createCustomerUser(appContainer, {
          email: "address-customer@medusa.js",
        })
        customerId = customer.id
      })

      it("persists address_name when creating an address", async () => {
        const created = await api.post(
          `/admin/customers/${customerId}/addresses`,
          {
            address_name: "Home",
            address_1: "123 Main St",
            country_code: "us",
          },
          adminHeaders
        )

        expect(created.status).toEqual(200)

        const addresses = created.data.customer.addresses
        expect(addresses).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ address_name: "Home" }),
          ])
        )
      })

      it("returns address_name on the address detail endpoint", async () => {
        const created = await api.post(
          `/admin/customers/${customerId}/addresses`,
          {
            address_name: "Office",
            address_1: "1 Market St",
            country_code: "us",
          },
          adminHeaders
        )

        const addressId = created.data.customer.addresses.find(
          (a: { address_name: string }) => a.address_name === "Office"
        ).id

        const res = await api.get(
          `/admin/customers/${customerId}/addresses/${addressId}`,
          adminHeaders
        )

        expect(res.status).toEqual(200)
        expect(res.data.address).toEqual(
          expect.objectContaining({
            id: addressId,
            address_name: "Office",
          })
        )
      })

      it("persists an updated address_name", async () => {
        const created = await api.post(
          `/admin/customers/${customerId}/addresses`,
          {
            address_name: "Home",
            address_1: "123 Main St",
            country_code: "us",
          },
          adminHeaders
        )

        const addressId = created.data.customer.addresses[0].id

        const updated = await api.post(
          `/admin/customers/${customerId}/addresses/${addressId}`,
          { address_name: "Summer House" },
          adminHeaders
        )

        expect(updated.status).toEqual(200)

        const res = await api.get(
          `/admin/customers/${customerId}/addresses/${addressId}`,
          adminHeaders
        )

        expect(res.data.address.address_name).toEqual("Summer House")
      })
    })
  },
})
