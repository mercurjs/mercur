import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
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
    describe("Admin - Region sellers", () => {
      let appContainer: MedusaContainer
      let regionModuleService: IRegionModuleService
      let sellerA: any
      let sellerB: any
      let usRegion: any
      let euRegion: any

      beforeAll(async () => {
        appContainer = getContainer()
        regionModuleService = appContainer.resolve(Modules.REGION)
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        sellerA = (
          await createSellerUser(appContainer, {
            email: "alpha@test.com",
            name: "Alpha Store",
          })
        ).seller
        sellerB = (
          await createSellerUser(appContainer, {
            email: "beta@test.com",
            name: "Beta Store",
          })
        ).seller

        ;[usRegion, euRegion] = await regionModuleService.createRegions([
          { name: "United States", currency_code: "usd", countries: ["us"] },
          { name: "Europe", currency_code: "eur", countries: ["de"] },
        ])
      })

      describe("POST /admin/regions/:id/sellers", () => {
        it("adds and removes sellers on a region", async () => {
          const addResponse = await api.post(
            `/admin/regions/${usRegion.id}/sellers`,
            { add: [sellerA.id, sellerB.id] },
            adminHeaders
          )

          expect(addResponse.status).toEqual(200)
          expect(addResponse.data).toEqual({
            id: usRegion.id,
            object: "region",
          })

          const listResponse = await api.get(
            `/admin/sellers?region_id=${usRegion.id}`,
            adminHeaders
          )

          expect(listResponse.status).toEqual(200)
          expect(listResponse.data.count).toEqual(2)
          expect(
            listResponse.data.sellers.map((s: any) => s.id).sort()
          ).toEqual([sellerA.id, sellerB.id].sort())

          const removeResponse = await api.post(
            `/admin/regions/${usRegion.id}/sellers`,
            { remove: [sellerB.id] },
            adminHeaders
          )

          expect(removeResponse.status).toEqual(200)

          const afterRemove = await api.get(
            `/admin/sellers?region_id=${usRegion.id}`,
            adminHeaders
          )

          expect(afterRemove.data.sellers.map((s: any) => s.id)).toEqual([
            sellerA.id,
          ])
        })

        it("returns an empty seller list for a region with no sellers", async () => {
          const response = await api.get(
            `/admin/sellers?region_id=${euRegion.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.sellers).toEqual([])
          expect(response.data.count).toEqual(0)
        })

        it("returns 404 when adding an unknown seller", async () => {
          const response = await api
            .post(
              `/admin/regions/${usRegion.id}/sellers`,
              { add: ["sel_does_not_exist"] },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })

        it("returns 404 when the region does not exist", async () => {
          const response = await api
            .post(
              `/admin/regions/reg_does_not_exist/sellers`,
              { add: [sellerA.id] },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("GET /admin/sellers/:id", () => {
        it("exposes the assigned regions on the seller", async () => {
          await api.post(
            `/admin/regions/${usRegion.id}/sellers`,
            { add: [sellerA.id] },
            adminHeaders
          )
          await api.post(
            `/admin/regions/${euRegion.id}/sellers`,
            { add: [sellerA.id] },
            adminHeaders
          )

          const response = await api.get(
            `/admin/sellers/${sellerA.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.seller.regions.map((r: any) => r.id)).toEqual(
            expect.arrayContaining([usRegion.id, euRegion.id])
          )
          expect(response.data.seller.regions[0]).toEqual(
            expect.objectContaining({
              name: expect.any(String),
              currency_code: expect.any(String),
            })
          )
        })
      })
    })
  },
})
