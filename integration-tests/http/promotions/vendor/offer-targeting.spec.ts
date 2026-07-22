import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Promotions offer targeting", () => {
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

      beforeAll(() => {
        appContainer = getContainer()
      })

      it("exposes 'offer' (not 'product') as a target-rule attribute", async () => {
        const { headers } = await seedSellerOffer({
          email: "attr-seller@test.com",
          name: "Attr Seller",
          offerSku: "ATTR-OFFER",
        })

        const response = await api.get(
          `/vendor/promotions/rule-attribute-options/target-rules?promotion_type=standard&application_method_target_type=items`,
          headers
        )

        expect(response.status).toEqual(200)
        const ids = response.data.attributes.map((a: any) => a.id)
        expect(ids).toContain("offer")
        expect(ids).not.toContain("product")

        const offerAttr = response.data.attributes.find(
          (a: any) => a.id === "offer"
        )
        expect(offerAttr.value).toEqual("items.metadata.offer_id")
      })

      it("returns only the seller's own offers as rule value options", async () => {
        const s1 = await seedSellerOffer({
          email: "vo-seller1@test.com",
          name: "VO Seller One",
          offerSku: "VO-S1-OFFER",
        })
        const s2 = await seedSellerOffer({
          email: "vo-seller2@test.com",
          name: "VO Seller Two",
          offerSku: "VO-S2-OFFER",
        })

        const response = await api.get(
          `/vendor/promotions/rule-value-options/target-rules/offer`,
          s1.headers
        )

        expect(response.status).toEqual(200)
        const values = response.data.values
        expect(values.some((v: any) => v.value === s1.offer.id)).toBe(true)
        expect(values.some((v: any) => v.value === s2.offer.id)).toBe(false)

        const own = values.find((v: any) => v.value === s1.offer.id)
        expect(own.label).toEqual("VO-S1-OFFER")
      })

      it("creates a promotion targeting a specific offer", async () => {
        const { headers, offer } = await seedSellerOffer({
          email: "create-seller@test.com",
          name: "Create Seller",
          offerSku: "CREATE-OFFER",
        })

        const response = await api.post(
          `/vendor/promotions`,
          {
            code: "OFFER10",
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
          headers
        )

        expect(response.status).toEqual(200)
        expect(response.data.promotion.code).toEqual("OFFER10")
        const targetRules =
          response.data.promotion.application_method.target_rules
        expect(
          targetRules.some(
            (r: any) => r.attribute === "items.metadata.offer_id"
          )
        ).toBe(true)
      })

      it("returns global rule value options for non seller-scoped attributes", async () => {
        const { headers } = await seedSellerOffer({
          email: "global-rule-seller@test.com",
          name: "Global Rule Seller",
          offerSku: "GLOBAL-RULE-OFFER",
        })

        for (const attribute of ["region", "currency_code", "sales_channel"]) {
          const response = await api.get(
            `/vendor/promotions/rule-value-options/rules/${attribute}?limit=10&offset=0&application_method_target_type=items`,
            headers
          )

          expect(response.status).toEqual(200)
          expect(Array.isArray(response.data.values)).toBe(true)
        }
      })
    })
  },
})
