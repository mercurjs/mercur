import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

/**
 * A vendor price-list override targets a marketplace **offer**: the override is a
 * native price in the variant's shared price set discriminated by an `offer_id`
 * price rule — the same mechanism the offer's own price uses. This spec locks in
 * the contract for the vendor surface: the seller's override applies to their own
 * offer and does NOT leak onto a different seller's offer of the same variant.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Price Lists (offer-scoped price rules)", () => {
      let appContainer: MedusaContainer
      let variantId: string
      let priceSetId: string
      let seller1Headers: any
      let offerA: any
      let offerB: any

      const seedSellerOffer = async (opts: {
        email: string
        name: string
        variantId: string
        amount: number
      }) => {
        const { seller, headers } = await createSellerUser(appContainer, {
          email: opts.email,
          name: opts.name,
        })
        const tag = `${opts.name}`

        const stockLocation = (
          await api.post(
            `/vendor/stock-locations`,
            { name: `Warehouse_${tag}` },
            headers
          )
        ).data.stock_location

        const shippingProfile = (
          await api.post(
            `/vendor/shipping-profiles`,
            { name: `SP_${tag}`, type: "default" },
            headers
          )
        ).data.shipping_profile

        const offer = (
          await api.post(
            `/vendor/offers`,
            {
              sku: `OF_${tag}`,
              variant_id: opts.variantId,
              shipping_profile_id: shippingProfile.id,
              inventory_items: [
                {
                  title: `Inv_${tag}`,
                  required_quantity: 1,
                  stock_levels: [
                    { location_id: stockLocation.id, stocked_quantity: 10 },
                  ],
                },
              ],
              prices: [{ amount: opts.amount, currency_code: "usd" }],
            },
            headers
          )
        ).data.offer

        return { seller, headers, offer }
      }

      const calc = async (offerId: string) => {
        const pricingModule = appContainer.resolve(Modules.PRICING)
        const [result] = await pricingModule.calculatePrices(
          { id: [priceSetId] },
          { context: { currency_code: "usd", offer_id: offerId } }
        )
        return result?.calculated_amount ?? null
      }

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        // A single master product + variant, sold by two sellers via two offers.
        const owner = await createSellerUser(appContainer, {
          email: "pl-vendor-owner@test.com",
          name: "ProductOwner",
        })
        const product = await createVendorProduct(api, owner.headers, {
          title: "Shared Master Product",
          sku: "V-SHARED-1",
        })
        variantId = product.variants[0].id

        const a = await seedSellerOffer({
          email: "pl-vendor-offer-a@test.com",
          name: "VOfferA",
          variantId,
          amount: 1000,
        })
        offerA = a.offer
        seller1Headers = a.headers

        offerB = (
          await seedSellerOffer({
            email: "pl-vendor-offer-b@test.com",
            name: "VOfferB",
            variantId,
            amount: 1000,
          })
        ).offer

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: variants } = await query.graph({
          entity: "product_variant",
          fields: ["id", "price_set.id"],
          filters: { id: variantId },
        })
        priceSetId = (variants[0] as any).price_set.id
      })

      it("creates an offer-scoped override that does not leak to another seller's offer", async () => {
        const res = await api.post(
          "/vendor/price-lists",
          {
            title: "Winter 24",
            description: "Offer A markdown",
            type: "override",
            status: "active",
            prices: [
              {
                variant_id: variantId,
                currency_code: "usd",
                amount: 500,
                rules: { offer_id: offerA.id },
              },
            ],
          },
          seller1Headers
        )

        expect(res.status).toEqual(201)
        const priceListId = res.data.price_list.id

        // The persisted price carries the offer_id rule (read via the data layer).
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: persisted } = await query.graph({
          entity: "price",
          filters: { price_list_id: priceListId },
          fields: ["id", "amount", "price_rules.attribute", "price_rules.value"],
        })
        expect(persisted).toHaveLength(1)
        expect((persisted[0] as any).price_rules).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              attribute: "offer_id",
              value: offerA.id,
            }),
          ])
        )

        // Isolation: the override wins for offer A, offer B keeps its base price.
        expect(await calc(offerA.id)).toEqual(500)
        expect(await calc(offerB.id)).toEqual(1000)
      })

      it("adds and updates offer-scoped prices via the /prices/batch route", async () => {
        const priceListId = (
          await api.post(
            "/vendor/price-lists",
            {
              title: "Batch PL",
              description: "batch",
              type: "override",
              status: "active",
              prices: [
                {
                  variant_id: variantId,
                  currency_code: "usd",
                  amount: 500,
                  rules: { offer_id: offerA.id },
                },
              ],
            },
            seller1Headers
          )
        ).data.price_list.id

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: created } = await query.graph({
          entity: "price",
          filters: { price_list_id: priceListId },
          fields: ["id"],
        })
        const priceId = (created[0] as any).id

        const batch = await api.post(
          `/vendor/price-lists/${priceListId}/prices/batch`,
          {
            update: [
              {
                id: priceId,
                variant_id: variantId,
                currency_code: "usd",
                amount: 300,
                rules: { offer_id: offerA.id },
              },
            ],
          },
          seller1Headers
        )
        expect(batch.status).toEqual(200)

        expect(await calc(offerA.id)).toEqual(300)
        expect(await calc(offerB.id)).toEqual(1000)
      })
    })
  },
})
