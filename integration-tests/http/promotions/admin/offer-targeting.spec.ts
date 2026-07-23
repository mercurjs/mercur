import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createAdminUser, adminHeaders } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Promotions offer targeting", () => {
      let appContainer: MedusaContainer

      const seedSellerOffer = async (opts: {
        email: string
        name: string
        offerSku: string
      }) => {
        const tag = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        const { seller, headers } = await createSellerUser(appContainer, {
          email: opts.email,
          name: opts.name,
        })

        const stockLocation = (
          await api.post(
            `/vendor/stock-locations`,
            { name: `${opts.name} WH ${tag}` },
            headers
          )
        ).data.stock_location

        const product = await createVendorProduct(api, headers, {
          title: `${opts.name} Product ${tag}`,
          sku: `${opts.email}-V-SKU-${tag}`,
        })

        const shippingProfile = (
          await api.post(
            `/vendor/shipping-profiles`,
            { name: `${opts.name} Profile ${tag}`, type: "default" },
            headers
          )
        ).data.shipping_profile

        const offer = (
          await api.post(
            `/vendor/offers`,
            {
              sku: opts.offerSku,
              variant_id: product.variants[0].id,
              shipping_profile_id: shippingProfile.id,
              inventory_items: [
                {
                  title: `${opts.name} Inv ${tag}`,
                  required_quantity: 1,
                  stock_levels: [
                    { location_id: stockLocation.id, stocked_quantity: 10 },
                  ],
                },
              ],
              prices: [{ amount: 2000, currency_code: "usd" }],
            },
            headers
          )
        ).data.offer

        return { seller, headers, offer }
      }

      beforeAll(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("exposes both 'offer' and 'product' as target-rule attributes", async () => {
        const response = await api.get(
          `/admin/promotions/rule-attribute-options/target-rules?promotion_type=standard&application_method_target_type=items`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const ids = response.data.attributes.map((a: any) => a.id)
        expect(ids).toContain("offer")
        expect(ids).toContain("product")

        const offerAttr = response.data.attributes.find(
          (a: any) => a.id === "offer"
        )
        expect(offerAttr.value).toEqual("items.metadata.offer_id")
      })

      it("returns offers from every seller as rule value options", async () => {
        const s1 = await seedSellerOffer({
          email: "admin-vo-seller1@test.com",
          name: "Admin VO Seller One",
          offerSku: "ADMIN-VO-S1-OFFER",
        })
        const s2 = await seedSellerOffer({
          email: "admin-vo-seller2@test.com",
          name: "Admin VO Seller Two",
          offerSku: "ADMIN-VO-S2-OFFER",
        })

        const response = await api.get(
          `/admin/promotions/rule-value-options/target-rules/offer`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const values = response.data.values
        expect(values.some((v: any) => v.value === s1.offer.id)).toBe(true)
        expect(values.some((v: any) => v.value === s2.offer.id)).toBe(true)

        const own = values.find((v: any) => v.value === s1.offer.id)
        expect(own.label).toEqual("ADMIN-VO-S1-OFFER")
      })

      it("scopes offer value options to a store via seller_id", async () => {
        const s1 = await seedSellerOffer({
          email: "admin-scoped-seller1@test.com",
          name: "Admin Scoped Seller One",
          offerSku: "ADMIN-SCOPED-S1-OFFER",
        })
        const s2 = await seedSellerOffer({
          email: "admin-scoped-seller2@test.com",
          name: "Admin Scoped Seller Two",
          offerSku: "ADMIN-SCOPED-S2-OFFER",
        })

        const response = await api.get(
          `/admin/promotions/rule-value-options/target-rules/offer?seller_id=${s1.seller.id}`,
          adminHeaders
        )

        expect(response.status).toEqual(200)
        const values = response.data.values
        expect(values.some((v: any) => v.value === s1.offer.id)).toBe(true)
        expect(values.some((v: any) => v.value === s2.offer.id)).toBe(false)
      })

      it("creates a promotion targeting a specific offer", async () => {
        const { offer } = await seedSellerOffer({
          email: "admin-create-seller@test.com",
          name: "Admin Create Seller",
          offerSku: "ADMIN-CREATE-OFFER",
        })

        const response = await api.post(
          `/admin/promotions`,
          {
            code: "ADMIN-OFFER10",
            type: "standard",
            status: "active",
            application_method: {
              type: "fixed",
              target_type: "items",
              allocation: "each",
              value: 500,
              currency_code: "usd",
              max_quantity: 1,
              target_rules: [
                {
                  attribute: "items.metadata.offer_id",
                  operator: "in",
                  values: [offer.id],
                },
              ],
            },
          },
          adminHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.promotion.code).toEqual("ADMIN-OFFER10")
        const targetRules =
          response.data.promotion.application_method.target_rules
        expect(
          targetRules.some((r: any) => r.attribute === "items.metadata.offer_id")
        ).toBe(true)
      })
    })
  },
})
