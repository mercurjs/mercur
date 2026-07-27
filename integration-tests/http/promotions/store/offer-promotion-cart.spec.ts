import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Store - Cart offer promotion", () => {
      let appContainer: MedusaContainer
      let storeHeaders: any
      let region: any
      let salesChannel: any

      const seedSellerOffer = async (opts: {
        email: string
        name: string
        offerPrice: number
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

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          headers
        )

        const product = await createVendorProduct(api, headers, {
          title: `${opts.name} Product ${tag}`,
          sku: `${opts.email}-V-SKU-${tag}`,
        })

        await api.post(
          `/vendor/sales-channels/${salesChannel.id}/products`,
          { add: [product.id] },
          headers
        )

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
              prices: [{ amount: opts.offerPrice, currency_code: "usd" }],
            },
            headers
          )
        ).data.offer

        return { seller, headers, offer, variant: product.variants[0] }
      }

      const createCart = async () =>
        (
          await api.post(
            `/store/carts`,
            {
              region_id: region.id,
              sales_channel_id: salesChannel.id,
              currency_code: "usd",
            },
            storeHeaders
          )
        ).data.cart

      const createOfferPromotion = async (
        headers: any,
        code: string,
        offerId: string,
        value: number,
        type: "fixed" | "percentage" = "fixed"
      ) =>
        (
          await api.post(
            `/vendor/promotions`,
            {
              code,
              type: "standard",
              status: "active",
              application_method: {
                type,
                target_type: "items",
                allocation: "each",
                value,
                ...(type === "fixed" ? { currency_code: "usd" } : {}),
                max_quantity: 1,
                target_rules: [
                  {
                    attribute: "items.metadata.offer_id",
                    operator: "in",
                    values: [offerId],
                  },
                ],
              },
            },
            headers
          )
        ).data.promotion

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        salesChannel = await appContainer
          .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
          .createSalesChannels({ name: "Default Store" })

        region = await appContainer
          .resolve<IRegionModuleService>(Modules.REGION)
          .createRegions({
            name: "Test Region",
            currency_code: "usd",
            countries: ["us"],
          })

        await appContainer.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.REGION]: { region_id: region.id },
          [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
        })

        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
      })

      it("applies the discount to the targeted offer line", async () => {
        const seed = await seedSellerOffer({
          email: "cart-promo@test.com",
          name: "Cart Promo",
          offerPrice: 2000,
          offerSku: "CART-PROMO-OFFER",
        })

        await createOfferPromotion(seed.headers, "OFFERCART", seed.offer.id, 500)

        const cart = await createCart()

        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: seed.offer.id, quantity: 1 },
          storeHeaders
        )

        const response = await api.post(
          `/store/carts/${cart.id}/promotions`,
          { promo_codes: ["OFFERCART"] },
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const line = response.data.cart.items[0]
        expect(line.adjustments).toHaveLength(1)
        expect(line.adjustments[0].amount).toEqual(500)
        expect(response.data.cart.discount_total).toEqual(500)
        expect(response.data.cart.item_subtotal).toEqual(2000)
        expect(response.data.cart.total).toEqual(1500)
      })

      it("applies a percentage discount and reduces the cart total", async () => {
        const seed = await seedSellerOffer({
          email: "cart-pct@test.com",
          name: "Cart Pct",
          offerPrice: 2000,
          offerSku: "CART-PCT-OFFER",
        })

        await createOfferPromotion(
          seed.headers,
          "OFFERPCT",
          seed.offer.id,
          10,
          "percentage"
        )

        const cart = await createCart()

        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: seed.offer.id, quantity: 1 },
          storeHeaders
        )

        const response = await api.post(
          `/store/carts/${cart.id}/promotions`,
          { promo_codes: ["OFFERPCT"] },
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const line = response.data.cart.items[0]
        expect(line.adjustments).toHaveLength(1)
        expect(line.adjustments[0].amount).toEqual(200)
        expect(response.data.cart.discount_total).toEqual(200)
        expect(response.data.cart.item_subtotal).toEqual(2000)
        expect(response.data.cart.total).toEqual(1800)
      })

      it("discounts only the promoting seller's offer in a multi-seller cart", async () => {
        const sellerA = await seedSellerOffer({
          email: "cart-multi-a@test.com",
          name: "Cart Multi A",
          offerPrice: 2000,
          offerSku: "CART-MULTI-A-OFFER",
        })

        const sellerB = await seedSellerOffer({
          email: "cart-multi-b@test.com",
          name: "Cart Multi B",
          offerPrice: 3000,
          offerSku: "CART-MULTI-B-OFFER",
        })

        // Seller A creates a promotion targeting only their own offer.
        await createOfferPromotion(
          sellerA.headers,
          "OFFERMULTI",
          sellerA.offer.id,
          500
        )

        const cart = await createCart()

        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: sellerA.offer.id, quantity: 1 },
          storeHeaders
        )
        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: sellerB.offer.id, quantity: 1 },
          storeHeaders
        )

        const response = await api.post(
          `/store/carts/${cart.id}/promotions`,
          { promo_codes: ["OFFERMULTI"] },
          storeHeaders
        )

        expect(response.status).toEqual(200)

        const items = response.data.cart.items
        const lineA = items.find(
          (i: any) => i.metadata?.offer_id === sellerA.offer.id
        )
        const lineB = items.find(
          (i: any) => i.metadata?.offer_id === sellerB.offer.id
        )

        expect(lineA.adjustments).toHaveLength(1)
        expect(lineA.adjustments[0].amount).toEqual(500)
        expect(lineB.adjustments ?? []).toHaveLength(0)

        expect(response.data.cart.discount_total).toEqual(500)
        expect(response.data.cart.item_subtotal).toEqual(5000)
        expect(response.data.cart.total).toEqual(4500)
      })

      it("does not discount an offer the promotion is not targeting", async () => {
        const seed = await seedSellerOffer({
          email: "cart-untargeted@test.com",
          name: "Cart Untargeted",
          offerPrice: 2000,
          offerSku: "CART-UNTARGETED-OFFER",
        })

        // Promotion targets a different (non-existent) offer id.
        await createOfferPromotion(
          seed.headers,
          "OFFERMISS",
          "offer_does_not_match",
          500
        )

        const cart = await createCart()

        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: seed.offer.id, quantity: 1 },
          storeHeaders
        )

        const response = await api.post(
          `/store/carts/${cart.id}/promotions`,
          { promo_codes: ["OFFERMISS"] },
          storeHeaders
        )

        expect(response.status).toEqual(200)
        const line = response.data.cart.items[0]
        expect(line.adjustments ?? []).toHaveLength(0)
        expect(response.data.cart.discount_total).toEqual(0)
      })
    })
  },
})
