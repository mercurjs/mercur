import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

import { createVendorProduct } from "../../../helpers/create-product"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { linkSellerRegions } from "../../../helpers/link-seller-regions"
import { seedSellerOfferWithShipping } from "../../../helpers/split-order-checkout"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Offer region prices", () => {
      let appContainer: MedusaContainer
      let regionModuleService: IRegionModuleService
      let salesChannelId: string
      let sellerId: string
      let headers: any
      let offer: any
      let usRegion: any
      let euRegion: any

      beforeAll(async () => {
        appContainer = getContainer()
        regionModuleService = appContainer.resolve(Modules.REGION)
      })

      beforeEach(async () => {
        const salesChannelModule = appContainer.resolve(Modules.SALES_CHANNEL)
        const [salesChannel] = await salesChannelModule.createSalesChannels([
          { name: `SC ${Date.now()}` },
        ])
        salesChannelId = salesChannel.id

        ;[usRegion, euRegion] = await regionModuleService.createRegions([
          { name: "United States", currency_code: "usd", countries: ["us"] },
          { name: "Europe", currency_code: "eur", countries: ["de"] },
        ])

        const seeded = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId,
          email: "region-seller@test.com",
          name: "RegionSeller",
          stocked: 10,
          offerPrice: 1000,
        })
        sellerId = seeded.sellerId
        headers = seeded.headers
        offer = seeded.offer

        await linkSellerRegions(appContainer, sellerId, [usRegion.id])
      })

      const regionPriceOf = (prices: any[], regionId: string) =>
        prices.find((p) =>
          (p.price_rules ?? []).some(
            (r: any) => r.attribute === "region_id" && r.value === regionId
          )
        )

      describe("POST /vendor/offers/:id", () => {
        it("stores a price scoped to an assigned region", async () => {
          const response = await api.post(
            `/vendor/offers/${offer.id}`,
            {
              prices: [
                { amount: 1000, currency_code: "usd" },
                {
                  amount: 1200,
                  currency_code: "usd",
                  rules: { region_id: usRegion.id },
                },
              ],
            },
            headers
          )

          expect(response.status).toEqual(200)
          const regionPrice = regionPriceOf(
            response.data.offer.prices,
            usRegion.id
          )
          expect(regionPrice).toEqual(
            expect.objectContaining({ amount: 1200, currency_code: "usd" })
          )
        })

        it("rejects a price for a region not assigned to the seller", async () => {
          const response = await api
            .post(
              `/vendor/offers/${offer.id}`,
              {
                prices: [
                  { amount: 1000, currency_code: "usd" },
                  {
                    amount: 900,
                    currency_code: "eur",
                    rules: { region_id: euRegion.id },
                  },
                ],
              },
              headers
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
          expect(response.data.message).toContain(euRegion.id)
        })

        it("rejects a region price whose currency does not match the region", async () => {
          const response = await api
            .post(
              `/vendor/offers/${offer.id}`,
              {
                prices: [
                  {
                    amount: 900,
                    currency_code: "eur",
                    rules: { region_id: usRegion.id },
                  },
                ],
              },
              headers
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
          expect(response.data.message).toContain("currency")
        })
      })

      describe("POST /vendor/offers", () => {
        it("creates an offer with an assigned-region price and rejects an unassigned one", async () => {
          const shippingProfile = await createShippingProfile(appContainer, {
            name: `SP region ${Date.now()}`,
          })
          const product = await createVendorProduct(api, headers, {
            title: `Region product ${Date.now()}`,
            sku: `REG-${Date.now()}`,
          })

          const base = {
            variant_id: product.variants[0].id,
            shipping_profile_id: shippingProfile.id,
            inventory_items: [{ title: "Inv", required_quantity: 1 }],
          }

          const rejected = await api
            .post(
              `/vendor/offers`,
              {
                ...base,
                sku: `OF-REJECT-${Date.now()}`,
                prices: [
                  {
                    amount: 500,
                    currency_code: "eur",
                    rules: { region_id: euRegion.id },
                  },
                ],
              },
              headers
            )
            .catch((e) => e.response)

          expect(rejected.status).toEqual(400)

          const created = await api.post(
            `/vendor/offers`,
            {
              ...base,
              sku: `OF-OK-${Date.now()}`,
              prices: [
                { amount: 500, currency_code: "usd" },
                {
                  amount: 650,
                  currency_code: "usd",
                  rules: { region_id: usRegion.id },
                },
              ],
            },
            headers
          )

          expect(created.status).toEqual(201)
          expect(
            regionPriceOf(created.data.offer.prices, usRegion.id)
          ).toEqual(expect.objectContaining({ amount: 650 }))
        })
      })

      describe("POST /vendor/shipping-options", () => {
        it("rejects a shipping option price for an unassigned region", async () => {
          const listed = await api.get(`/vendor/shipping-options`, headers)
          const existing = listed.data.shipping_options[0]

          const response = await api
            .post(
              `/vendor/shipping-options/${existing.id}`,
              {
                prices: [{ region_id: euRegion.id, amount: 700 }],
              },
              headers
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
          expect(response.data.message).toContain(euRegion.id)
        })

        it("accepts a shipping option price for an assigned region", async () => {
          const listed = await api.get(`/vendor/shipping-options`, headers)
          const existing = listed.data.shipping_options[0]

          const response = await api.post(
            `/vendor/shipping-options/${existing.id}?fields=*prices`,
            {
              prices: [{ region_id: usRegion.id, amount: 700 }],
            },
            headers
          )

          expect(response.status).toEqual(200)
        })
      })
    })
  },
})
