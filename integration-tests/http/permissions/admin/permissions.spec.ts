import { MedusaContainer } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IPermissionResolver,
  PERMISSION_RESOLVER,
  PermissionMap,
} from "@mercurjs/types"
import { asValue } from "@medusajs/framework/awilix"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"

jest.setTimeout(90000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Permissions - admin", () => {
      let container: MedusaContainer
      let granted: PermissionMap = {}

      const resolver: IPermissionResolver = {
        resolve: async () => granted,
      }

      beforeAll(() => {
        container = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
      })

      afterEach(() => {
        container.register(PERMISSION_RESOLVER, asValue(undefined))
      })

      const useResolver = (permissions: PermissionMap) => {
        granted = permissions
        container.register(PERMISSION_RESOLVER, asValue(resolver))
      }

      it("allows core and Mercur routes without a resolver", async () => {
        const orders = await api.get("/admin/orders", adminHeaders)
        const sellers = await api.get("/admin/sellers", adminHeaders)

        expect(orders.status).toEqual(200)
        expect(sellers.status).toEqual(200)
      })

      it("guards core Medusa routes through the Mercur route map", async () => {
        useResolver({ orders: "view" })

        const regions = await api
          .get("/admin/regions", adminHeaders)
          .catch((error) => error.response)

        expect(regions.status).toEqual(403)
        expect(regions.data).toEqual(
          expect.objectContaining({
            code: "MISSING_PERMISSION",
            permission: "regions_tax",
            right: "view",
          })
        )

        const orders = await api.get("/admin/orders", adminHeaders)
        expect(orders.status).toEqual(200)
      })

      it("guards seller approval separately from seller editing", async () => {
        useResolver({ sellers: "edit" })

        const response = await api
          .post("/admin/sellers/sel_missing/approve", {}, adminHeaders)
          .catch((error) => error.response)

        expect(response.status).toEqual(403)
        expect(response.data.permission).toEqual("sellers.approval")
      })

      it("returns permissions on users/me when requested", async () => {
        useResolver({ users: "view" })

        const response = await api.get(
          "/admin/users/me?fields=+permissions",
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.user.permissions).toEqual({ users: "view" })
      })
    })
  },
})
