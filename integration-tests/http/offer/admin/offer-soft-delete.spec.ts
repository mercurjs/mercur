import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Offers soft-delete visibility", () => {
      let appContainer: MedusaContainer
      let sellerHeaders: any
      let offerId: string

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const { headers } = await createSellerUser(appContainer, {
          email: "softdelete@test.com",
          name: "SoftDelete",
        })
        sellerHeaders = headers

        const shippingProfile = await createShippingProfile(appContainer, { name: "SoftDel Profile" })
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Soft Delete Product",
          sku: "SOFT-DEL",
        })
        const stockLocation = (
          await api.post(`/vendor/stock-locations`, { name: "SoftDel WH" }, sellerHeaders)
        ).data.stock_location

        offerId = (
          await api.post(
            `/vendor/offers`,
            {
              sku: "SOFT-DEL-OFFER",
              variant_id: product.variants[0].id,
              shipping_profile_id: shippingProfile.id,
              prices: [{ amount: 1000, currency_code: "usd" }],
              inventory_items: [
                {
                  title: "SoftDel Inv",
                  required_quantity: 1,
                  stock_levels: [{ location_id: stockLocation.id, stocked_quantity: 5 }],
                },
              ],
            },
            sellerHeaders
          )
        ).data.offer.id
      })

      it("hides deleted offers by default and exposes them with with_deleted or a deleted_at filter", async () => {
        const before = new Date().toISOString()
        await api.delete(`/admin/offers/${offerId}`, adminHeaders)

        const hidden = await api.get(`/admin/offers?id=${offerId}`, adminHeaders)
        expect(hidden.data.offers).toHaveLength(0)

        const shown = await api.get(
          `/admin/offers?id=${offerId}&with_deleted=true`,
          adminHeaders
        )
        expect(shown.data.offers).toHaveLength(1)
        expect(shown.data.offers[0].deleted_at).toBeTruthy()

        const byCursor = await api.get(
          `/admin/offers?deleted_at[$gte]=${encodeURIComponent(before)}`,
          adminHeaders
        )
        expect(byCursor.data.offers.map((o: any) => o.id)).toContain(offerId)
      })
    })
  },
})
