import { MedusaContainer } from "@medusajs/framework/types"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IPermissionResolver,
  PERMISSIONS_MODULE,
  PermissionMap,
} from "@mercurjs/types"
import { asValue } from "@medusajs/framework/awilix"
import { ConfigModule } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(90000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Permissions - vendor", () => {
      let container: MedusaContainer
      let headers: { headers: Record<string, string> }
      let granted: PermissionMap | null

      const resolver: IPermissionResolver = {
        resolvePermissions: async () => granted ?? {},
      }

      const modulesConfig = () => {
        const config = container.resolve<ConfigModule>(
          ContainerRegistrationKeys.CONFIG_MODULE
        )
        config.modules ??= {}
        return config.modules as Record<string, unknown>
      }

      beforeAll(() => {
        container = getContainer()
      })

      beforeEach(async () => {
        granted = null
        await createAdminUser(dbConnection, adminHeaders, container)
        const result = await createSellerUser(container, {
          email: "permissions-seller@test.com",
          name: "Permissions Store",
        })
        headers = result.headers
      })

      afterEach(() => {
        delete modulesConfig()[PERMISSIONS_MODULE]
      })

      const useResolver = (permissions: PermissionMap) => {
        granted = permissions
        modulesConfig()[PERMISSIONS_MODULE] = { resolve: "test-permissions" }
        container.register(PERMISSIONS_MODULE, asValue(resolver))
      }

      it("allows everything when the permissions module is not configured", async () => {
        const orders = await api.get("/vendor/orders", headers)
        const payouts = await api.get("/vendor/payouts", headers)

        expect(orders.status).toEqual(200)
        expect(payouts.status).toEqual(200)
      })

      it("omits the permissions field when the permissions module is not configured", async () => {
        const response = await api.get(
          "/vendor/members/me?fields=+permissions",
          headers
        )

        expect(response.status).toEqual(200)
        expect(response.data.seller_member.id).toBeDefined()
        expect(response.data.seller_member.permissions).toBeUndefined()
      })

      it("enforces the resolved rights", async () => {
        useResolver({ orders: "view" })

        const orders = await api.get("/vendor/orders", headers)
        expect(orders.status).toEqual(200)

        const payouts = await api
          .get("/vendor/payouts", headers)
          .catch((error) => error.response)

        expect(payouts.status).toEqual(403)
        expect(payouts.data).toEqual(
          expect.objectContaining({
            code: "MISSING_PERMISSION",
            permission: "payouts",
            right: "view",
          })
        )
      })

      it("returns the permissions field when requested", async () => {
        useResolver({ orders: "edit", store: "view" })

        const withField = await api.get(
          "/vendor/members/me?fields=+permissions",
          headers
        )
        expect(withField.data.seller_member.permissions).toEqual({
          orders: "edit",
          store: "view",
        })

        const withoutField = await api.get("/vendor/members/me", headers)
        expect(withoutField.data.seller_member.permissions).toBeUndefined()
      })
    })
  },
})
