import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Price Lists (marketplace fields)", () => {
      let appContainer: MedusaContainer
      let sellerHeaders: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const seller = await createSellerUser(appContainer, {
          email: "pl-owner@test.com",
          name: "Owner Store",
        })
        sellerHeaders = seller.headers

        // Vendor-created price list is linked to the seller via
        // createSellerPriceListsWorkflow — this is the "store-owned" case.
        await api.post(
          "/vendor/price-lists",
          {
            title: "Owner Store PL",
            description: "seller owned",
            status: "active",
            type: "sale",
          },
          sellerHeaders
        )
      })

      it("resolves the owning seller via +seller.name (Owner column)", async () => {
        const res = await api.get(
          "/admin/price-lists?fields=%2Bseller.name",
          adminHeaders
        )

        expect(res.status).toEqual(200)
        const pl = res.data.price_lists.find(
          (p: any) => p.title === "Owner Store PL"
        )
        expect(pl).toBeDefined()
        // The field must actually come back non-empty — not just type-check.
        expect(pl.seller).toBeDefined()
        expect(pl.seller.name).toEqual("Owner Store")
      })

      it("accepts the marketplace list filters (type / status / created_at / updated_at)", async () => {
        const type = await api.get(
          "/admin/price-lists?type[]=sale",
          adminHeaders
        )
        expect(type.status).toEqual(200)
        expect(
          type.data.price_lists.some((p: any) => p.title === "Owner Store PL")
        ).toBe(true)

        const override = await api.get(
          "/admin/price-lists?type[]=override",
          adminHeaders
        )
        expect(override.status).toEqual(200)
        expect(
          override.data.price_lists.some(
            (p: any) => p.title === "Owner Store PL"
          )
        ).toBe(false)

        const status = await api.get(
          "/admin/price-lists?status[]=active",
          adminHeaders
        )
        expect(status.status).toEqual(200)

        const created = await api.get(
          "/admin/price-lists?created_at[$gte]=2020-01-01",
          adminHeaders
        )
        expect(created.status).toEqual(200)

        const updated = await api.get(
          "/admin/price-lists?updated_at[$lte]=2999-01-01",
          adminHeaders
        )
        expect(updated.status).toEqual(200)
      })
    })
  },
})
