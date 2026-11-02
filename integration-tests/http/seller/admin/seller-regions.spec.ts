import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  IStoreModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Seller regions", () => {
      let appContainer: MedusaContainer
      let regionModuleService: IRegionModuleService
      let storeModuleService: IStoreModuleService
      let usRegion: any
      let euRegion: any

      const sellerPayload = (suffix: string) => ({
        name: `Seller ${suffix}`,
        email: `seller-${suffix}@test.com`,
        currency_code: "usd",
        member: { email: `member-${suffix}@test.com` },
      })

      const setDefaultRegion = async (regionId: string | null) => {
        const [store] = await storeModuleService.listStores()
        await storeModuleService.updateStores(store.id, {
          default_region_id: regionId,
        })
      }

      beforeAll(async () => {
        appContainer = getContainer()
        regionModuleService = appContainer.resolve(Modules.REGION)
        storeModuleService = appContainer.resolve(Modules.STORE)
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        ;[usRegion, euRegion] = await regionModuleService.createRegions([
          { name: "United States", currency_code: "usd", countries: ["us"] },
          { name: "Europe", currency_code: "eur", countries: ["de"] },
        ])
      })

      describe("POST /admin/sellers", () => {
        it("links the given region_ids together with the store default region", async () => {
          await setDefaultRegion(usRegion.id)

          const response = await api.post(
            `/admin/sellers`,
            { ...sellerPayload("explicit"), region_ids: [euRegion.id] },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller.regions.map((r: any) => r.id).sort()).toEqual(
            [usRegion.id, euRegion.id].sort()
          )
        })

        it("links the given region_ids when the store has no default region", async () => {
          await setDefaultRegion(null)

          const response = await api.post(
            `/admin/sellers`,
            { ...sellerPayload("explicit-only"), region_ids: [euRegion.id] },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller.regions.map((r: any) => r.id)).toEqual([
            euRegion.id,
          ])
        })

        it("links the store default region when region_ids is omitted", async () => {
          await setDefaultRegion(usRegion.id)

          const response = await api.post(
            `/admin/sellers`,
            sellerPayload("default"),
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.seller.regions.map((r: any) => r.id)).toEqual([
            usRegion.id,
          ])
        })

        it("returns 404 for an unknown region id", async () => {
          const response = await api
            .post(
              `/admin/sellers`,
              { ...sellerPayload("bad"), region_ids: ["reg_missing"] },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("seller account registration", () => {
        it("links the store default region to a self-registered seller", async () => {
          await setDefaultRegion(euRegion.id)

          const { seller } = await createSellerUser(appContainer, {
            email: "registered@test.com",
            name: "Registered Seller",
          })

          const response = await api.get(
            `/admin/sellers/${seller.id}`,
            adminHeaders
          )

          expect(response.data.seller.regions.map((r: any) => r.id)).toEqual([
            euRegion.id,
          ])
        })
      })

      describe("POST /admin/sellers/:id/regions", () => {
        it("adds and removes regions on a seller", async () => {
          await setDefaultRegion(usRegion.id)
          const { seller } = await createSellerUser(appContainer, {
            email: "linked@test.com",
            name: "Linked Seller",
          })

          const addResponse = await api.post(
            `/admin/sellers/${seller.id}/regions`,
            { add: [euRegion.id] },
            adminHeaders
          )

          expect(addResponse.status).toEqual(200)
          expect(addResponse.data).toEqual({ id: seller.id, object: "seller" })

          let detail = await api.get(`/admin/sellers/${seller.id}`, adminHeaders)
          expect(detail.data.seller.regions.map((r: any) => r.id).sort()).toEqual(
            [usRegion.id, euRegion.id].sort()
          )

          const removeResponse = await api.post(
            `/admin/sellers/${seller.id}/regions`,
            { remove: [usRegion.id] },
            adminHeaders
          )

          expect(removeResponse.status).toEqual(200)

          detail = await api.get(`/admin/sellers/${seller.id}`, adminHeaders)
          expect(detail.data.seller.regions.map((r: any) => r.id)).toEqual([
            euRegion.id,
          ])
        })

        it("refuses to remove the last region of a seller", async () => {
          await setDefaultRegion(usRegion.id)
          const { seller } = await createSellerUser(appContainer, {
            email: "last-region@test.com",
            name: "Last Region Seller",
          })

          const response = await api
            .post(
              `/admin/sellers/${seller.id}/regions`,
              { remove: [usRegion.id] },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)

          const swap = await api.post(
            `/admin/sellers/${seller.id}/regions`,
            { add: [euRegion.id], remove: [usRegion.id] },
            adminHeaders
          )

          expect(swap.status).toEqual(200)
        })

        it("returns 404 for an unknown region", async () => {
          const { seller } = await createSellerUser(appContainer, {
            email: "unknown-region@test.com",
            name: "Unknown Region Seller",
          })

          const response = await api
            .post(
              `/admin/sellers/${seller.id}/regions`,
              { add: ["reg_missing"] },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })
    })
  },
})
