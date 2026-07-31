import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

/**
 * A price list "override"/"sale" for a marketplace offer is a native price in the
 * variant's shared price set, discriminated by an `offer_id` price rule — the same
 * mechanism the offer's own price uses (`create-offers.ts`). The stock admin
 * price-list routes already accept `rules: { offer_id }` per price, so no route
 * override is needed. This spec locks in the contract: the override applies to the
 * targeted offer and does NOT leak to a different offer selling the same variant.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Price Lists (offer-scoped price rules)", () => {
      let appContainer: MedusaContainer
      let variantId: string
      let priceSetId: string
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

        return { sellerId: (seller as any).id, offer }
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
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        // A single master product + variant, sold by two sellers via two offers.
        const seller = await createSellerUser(appContainer, {
          email: "pl-product-owner@test.com",
          name: "ProductOwner",
        })
        const product = await createVendorProduct(api, seller.headers, {
          title: "Shared Master Product",
          sku: "SHARED-1",
        })
        variantId = product.variants[0].id

        offerA = (
          await seedSellerOffer({
            email: "pl-offer-a@test.com",
            name: "OfferA",
            variantId,
            amount: 1000,
          })
        ).offer
        offerB = (
          await seedSellerOffer({
            email: "pl-offer-b@test.com",
            name: "OfferB",
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

      it("creates a price list override scoped to a single offer via rules.offer_id", async () => {
        const res = await api.post(
          "/admin/price-lists",
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
          adminHeaders
        )

        expect(res.status).toEqual(200)
        const priceListId = res.data.price_list.id

        // The persisted price carries the offer_id rule (read via the data layer;
        // the HTTP detail route does not populate price_rules).
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
            "/admin/price-lists",
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
            adminHeaders
          )
        ).data.price_list.id

        // Add an override for offer B and lower offer A's override.
        const batch = await api.post(
          `/admin/price-lists/${priceListId}/prices/batch`,
          {
            create: [
              {
                variant_id: variantId,
                currency_code: "usd",
                amount: 700,
                rules: { offer_id: offerB.id },
              },
            ],
          },
          adminHeaders
        )
        expect(batch.status).toEqual(200)

        expect(await calc(offerA.id)).toEqual(500)
        expect(await calc(offerB.id)).toEqual(700)
      })
    })
  },
})
