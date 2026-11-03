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
    describe("Permissions - admin", () => {
      let container: MedusaContainer
      let granted: PermissionMap = {}

      const resolver: IPermissionResolver = {
        resolvePermissions: async () => granted,
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
        await createAdminUser(dbConnection, adminHeaders, container)
      })

      afterEach(() => {
        delete modulesConfig()[PERMISSIONS_MODULE]
      })

      const useResolver = (permissions: PermissionMap) => {
        granted = permissions
        modulesConfig()[PERMISSIONS_MODULE] = { resolve: "test-permissions" }
        container.register(PERMISSIONS_MODULE, asValue(resolver))
      }

      it("allows core and Mercur routes without the permissions module", async () => {
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
            permission: "regions",
            right: "view",
          })
        )

        const orders = await api.get("/admin/orders", adminHeaders)
        expect(orders.status).toEqual(200)
      })

      it("guards case and slash variants of core routes", async () => {
        useResolver({ orders: "view" })

        for (const url of [
          "/admin/Products",
          "/admin/PRODUCTS/",
          "/admin//products",
        ]) {
          const response = await api
            .post(url, { title: "Bypass" }, adminHeaders)
            .catch((error) => error.response)

          expect(response.status).toEqual(403)
          expect(response.data).toEqual(
            expect.objectContaining({
              code: "MISSING_PERMISSION",
              permission: "products",
              right: "edit",
            })
          )
        }
      })

      it("fails closed on unknown admin paths for an actor without grants", async () => {
        useResolver({})

        const response = await api
          .get("/admin/not-a-route", adminHeaders)
          .catch((error) => error.response)

        expect(response.status).toEqual(403)
        expect(response.data.code).toEqual("MISSING_PERMISSION")
      })

      it("requires sellers.premium:edit to change is_premium", async () => {
        const { seller } = await createSellerUser(container, {
          email: "premium@test.com",
          name: "Premium Candidate",
        })

        useResolver({ sellers: "edit" })

        const denied = await api
          .post(`/admin/sellers/${seller.id}`, { is_premium: true }, adminHeaders)
          .catch((error) => error.response)

        expect(denied.status).toEqual(403)
        expect(denied.data).toEqual(
          expect.objectContaining({
            code: "MISSING_PERMISSION",
            permission: "sellers.premium",
            right: "edit",
          })
        )

        const plain = await api.post(
          `/admin/sellers/${seller.id}`,
          { name: "Renamed Candidate" },
          adminHeaders
        )
        expect(plain.status).toEqual(200)
        expect(plain.data.seller.is_premium).toBe(false)

        useResolver({ sellers: "edit", "sellers.premium": "edit" })

        const allowed = await api.post(
          `/admin/sellers/${seller.id}`,
          { is_premium: true },
          adminHeaders
        )
        expect(allowed.status).toEqual(200)
        expect(allowed.data.seller.is_premium).toBe(true)
      })

      it("guards seller approval separately from seller editing", async () => {
        useResolver({ sellers: "edit" })

        const response = await api
          .post("/admin/sellers/sel_missing/approve", {}, adminHeaders)
          .catch((error) => error.response)

        expect(response.status).toEqual(403)
        expect(response.data.permission).toEqual("sellers.approval")
      })

      it("lets any admin read the store but requires store:edit to update it", async () => {
        useResolver({ products: "view" })

        const list = await api.get("/admin/stores", adminHeaders)
        expect(list.status).toEqual(200)

        const storeId = list.data.stores[0].id

        const detail = await api.get(`/admin/stores/${storeId}`, adminHeaders)
        expect(detail.status).toEqual(200)

        const update = await api
          .post(`/admin/stores/${storeId}`, { name: "Renamed" }, adminHeaders)
          .catch((error) => error.response)

        expect(update.status).toEqual(403)
        expect(update.data).toEqual(
          expect.objectContaining({
            code: "MISSING_PERMISSION",
            permission: "store",
            right: "edit",
          })
        )
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

      it("lists order groups with orders:view", async () => {
        useResolver({ orders: "view" })

        const allowed = await api.get("/admin/order-groups", adminHeaders)
        expect(allowed.status).toEqual(200)

        useResolver({ products: "view" })

        const denied = await api
          .get("/admin/order-groups", adminHeaders)
          .catch((error) => error.response)

        expect(denied.status).toEqual(403)
      })

      it("lets an admin edit their own profile without users:edit", async () => {
        useResolver({ orders: "view" })

        const me = await api.get("/admin/users/me", adminHeaders)
        const userId = me.data.user.id

        const self = await api.post(
          "/admin/users/me",
          { first_name: "Renamed" },
          adminHeaders
        )

        expect(self.status).toEqual(200)
        expect(self.data.user).toEqual(
          expect.objectContaining({ id: userId, first_name: "Renamed" })
        )

        const byId = await api
          .post(`/admin/users/${userId}`, { first_name: "Other" }, adminHeaders)
          .catch((error) => error.response)

        expect(byId.status).toEqual(403)
        expect(byId.data).toEqual(
          expect.objectContaining({ permission: "users", right: "edit" })
        )
      })
    })
  },
})
