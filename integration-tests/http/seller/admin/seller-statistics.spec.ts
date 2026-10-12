import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ConfigModule, MedusaContainer } from "@medusajs/framework/types"
import { asValue } from "@medusajs/framework/awilix"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  IPermissionResolver,
  ISellerModuleService,
  MercurModules,
  PERMISSIONS_MODULE,
  PermissionMap,
  SellerStatus,
} from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

type SellerServiceUnderTest = ISellerModuleService & {
  updateSellers(data: {
    id: string
    status?: SellerStatus
    is_premium?: boolean
  }): Promise<unknown>
  softDeleteSellers(ids: string[]): Promise<unknown>
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("GET /admin/sellers/statistics", () => {
      let container: MedusaContainer
      let sellerService: SellerServiceUnderTest
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

      const createSeller = async (
        tag: string,
        data: { status: SellerStatus; is_premium?: boolean }
      ) => {
        const { seller } = await createSellerUser(container, {
          email: `${tag}@statistics.test`,
          name: `Seller ${tag}`,
        })
        await sellerService.updateSellers({ id: seller.id, ...data })
        return seller
      }

      beforeAll(() => {
        container = getContainer()
        sellerService = container.resolve(MercurModules.SELLER)
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
      })

      afterEach(() => {
        delete modulesConfig()[PERMISSIONS_MODULE]
      })

      it("counts sellers by status and premium sellers", async () => {
        await createSeller("open", {
          status: SellerStatus.OPEN,
          is_premium: true,
        })
        await createSeller("pending", { status: SellerStatus.PENDING_APPROVAL })
        await createSeller("suspended", { status: SellerStatus.SUSPENDED })
        await createSeller("terminated", { status: SellerStatus.TERMINATED })

        const response = await api.get("/admin/sellers/statistics", adminHeaders)

        expect(response.status).toEqual(200)
        expect(response.data).toEqual({
          statistics: {
            total: 4,
            premium: 1,
            by_status: {
              open: 1,
              pending_approval: 1,
              suspended: 1,
              terminated: 1,
            },
          },
        })
      })

      it("does not count soft-deleted sellers", async () => {
        const kept = await createSeller("kept", { status: SellerStatus.OPEN })
        const removed = await createSeller("removed", {
          status: SellerStatus.OPEN,
          is_premium: true,
        })
        await sellerService.softDeleteSellers([removed.id])

        const response = await api.get("/admin/sellers/statistics", adminHeaders)

        expect(response.status).toEqual(200)
        expect(response.data.statistics).toEqual(
          expect.objectContaining({
            total: 1,
            premium: 0,
            by_status: expect.objectContaining({ open: 1 }),
          })
        )
        expect(kept.id).toBeDefined()
      })

      it("returns every status key even when no seller has it", async () => {
        const response = await api.get("/admin/sellers/statistics", adminHeaders)

        expect(response.status).toEqual(200)
        expect(response.data.statistics).toEqual({
          total: 0,
          premium: 0,
          by_status: {
            open: 0,
            pending_approval: 0,
            suspended: 0,
            terminated: 0,
          },
        })
      })

      it("requires sellers:view", async () => {
        granted = { orders: "view" }
        modulesConfig()[PERMISSIONS_MODULE] = { resolve: "test-permissions" }
        container.register(PERMISSIONS_MODULE, asValue(resolver))

        const response = await api
          .get("/admin/sellers/statistics", adminHeaders)
          .catch((error: { response: unknown }) => error.response)

        expect(response.status).toEqual(403)
        expect(response.data).toEqual(
          expect.objectContaining({ permission: "sellers", right: "view" })
        )
      })
    })
  },
})
