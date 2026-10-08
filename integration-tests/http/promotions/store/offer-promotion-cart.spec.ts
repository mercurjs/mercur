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
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createVendorProduct } from "../../../helpers/create-product"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import { seedSellerOfferWithShipping } from "../../../helpers/split-order-checkout"

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

        const shippingProfile = await createShippingProfile(appContainer, {
            name: `${opts.name} Profile ${tag}`,
        })

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

      const createUntargetedPromotion = async (
        headers: any,
        code: string,
        value: number,
        isAutomatic = false
      ) =>
        (
          await api.post(
            `/vendor/promotions`,
            {
              code,
              type: "standard",
              status: "active",
              is_automatic: isAutomatic,
              application_method: {
                type: "percentage",
                target_type: "items",
                allocation: "each",
                value,
                max_quantity: 1,
              },
            },
            headers
          )
        ).data.promotion

      const getCart = async (cartId: string, headers = storeHeaders) =>
        (await api.get(`/store/carts/${cartId}`, headers)).data.cart

      const findLine = (cart: any, offerId: string) =>
        cart.items.find((i: any) => i.metadata?.offer_id === offerId)

      const expectOnlySellerADiscounted = (
        cart: any,
        offerA: string,
        offerB: string,
        amount: number
      ) => {
        const lineA = findLine(cart, offerA)
        const lineB = findLine(cart, offerB)
        expect(lineA.adjustments).toHaveLength(1)
        expect(lineA.adjustments[0].amount).toEqual(amount)
        expect(lineB.adjustments ?? []).toHaveLength(0)
        expect(cart.discount_total).toEqual(amount)
      }

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

      it("keeps an untargeted seller promotion scoped across cart refreshes", async () => {
        const sellerA = await seedSellerOffer({
          email: "cart-refresh-a@test.com",
          name: "Cart Refresh A",
          offerPrice: 2000,
          offerSku: "CART-REFRESH-A-OFFER",
        })
        const sellerB = await seedSellerOffer({
          email: "cart-refresh-b@test.com",
          name: "Cart Refresh B",
          offerPrice: 3000,
          offerSku: "CART-REFRESH-B-OFFER",
        })

        await createUntargetedPromotion(sellerA.headers, "REFRESHA", 10)

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

        const applied = await api.post(
          `/store/carts/${cart.id}/promotions`,
          { promo_codes: ["REFRESHA"] },
          storeHeaders
        )
        expect(applied.status).toEqual(200)
        expectOnlySellerADiscounted(
          applied.data.cart,
          sellerA.offer.id,
          sellerB.offer.id,
          200
        )

        const updated = await api.post(
          `/store/carts/${cart.id}`,
          { email: "refresh-buyer@test.com" },
          storeHeaders
        )
        expect(updated.status).toEqual(200)
        expectOnlySellerADiscounted(
          await getCart(cart.id),
          sellerA.offer.id,
          sellerB.offer.id,
          200
        )

        const lineB = findLine(updated.data.cart, sellerB.offer.id)
        const quantityUpdated = await api.post(
          `/store/carts/${cart.id}/line-items/${lineB.id}`,
          { quantity: 2 },
          storeHeaders
        )
        expect(quantityUpdated.status).toEqual(200)
        expectOnlySellerADiscounted(
          await getCart(cart.id),
          sellerA.offer.id,
          sellerB.offer.id,
          200
        )
      })

      it("applies an automatic seller promotion only to that seller's items", async () => {
        const sellerA = await seedSellerOffer({
          email: "cart-auto-a@test.com",
          name: "Cart Auto A",
          offerPrice: 2000,
          offerSku: "CART-AUTO-A-OFFER",
        })
        const sellerB = await seedSellerOffer({
          email: "cart-auto-b@test.com",
          name: "Cart Auto B",
          offerPrice: 3000,
          offerSku: "CART-AUTO-B-OFFER",
        })

        await createUntargetedPromotion(sellerA.headers, "AUTOA", 10, true)

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
        expectOnlySellerADiscounted(
          await getCart(cart.id),
          sellerA.offer.id,
          sellerB.offer.id,
          200
        )

        await api.post(
          `/store/carts/${cart.id}`,
          { email: "auto-buyer@test.com" },
          storeHeaders
        )
        expectOnlySellerADiscounted(
          await getCart(cart.id),
          sellerA.offer.id,
          sellerB.offer.id,
          200
        )
      })

      it("does not carry a seller promotion onto another seller's split order", async () => {
        const customer = await createCustomerUser(appContainer, {
          email: "split-promo-buyer@test.com",
          first_name: "Split",
          last_name: "Buyer",
        })
        const buyerHeaders = {
          headers: {
            ...storeHeaders.headers,
            ...customer.headers.headers,
          },
        }

        const sellerA = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId: salesChannel.id,
          email: "cart-split-a@test.com",
          name: "CartSplitA",
          stocked: 10,
          offerPrice: 2000,
        })
        const sellerB = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId: salesChannel.id,
          email: "cart-split-b@test.com",
          name: "CartSplitB",
          stocked: 10,
          offerPrice: 3000,
        })

        const promotion = await createUntargetedPromotion(
          sellerA.headers,
          "SPLITA",
          10,
          true
        )

        const cart = (
          await api.post(
            `/store/carts`,
            {
              region_id: region.id,
              sales_channel_id: salesChannel.id,
              currency_code: "usd",
            },
            buyerHeaders
          )
        ).data.cart
        for (const offerId of [sellerA.offer.id, sellerB.offer.id]) {
          await api.post(
            `/store/carts/${cart.id}/line-items`,
            { offer_id: offerId, quantity: 1 },
            buyerHeaders
          )
        }

        const address = {
          first_name: "Split",
          last_name: "Buyer",
          address_1: "123 Main St",
          city: "New York",
          country_code: "us",
          postal_code: "10001",
        }
        await api.post(
          `/store/carts/${cart.id}`,
          {
            email: customer.customer.email,
            shipping_address: address,
            billing_address: address,
          },
          buyerHeaders
        )

        const shippingOptions = Object.values(
          (
            await api.get(
              `/store/shipping-options?cart_id=${cart.id}`,
              buyerHeaders
            )
          ).data.shipping_options as Record<string, any[]>
        ).flat()
        for (const option of shippingOptions) {
          await api.post(
            `/store/carts/${cart.id}/shipping-methods`,
            { option_id: option.id },
            buyerHeaders
          )
        }

        expectOnlySellerADiscounted(
          await getCart(cart.id, buyerHeaders),
          sellerA.offer.id,
          sellerB.offer.id,
          200
        )

        const paymentCollection = (
          await api.post(
            `/store/payment-collections`,
            { cart_id: cart.id },
            buyerHeaders
          )
        ).data.payment_collection
        await api.post(
          `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
          { provider_id: "pp_system_default" },
          buyerHeaders
        )

        const completed = await api.post(
          `/store/carts/${cart.id}/complete`,
          {},
          buyerHeaders
        )
        expect(completed.status).toEqual(200)
        expect(completed.data.type).toEqual("order_group")

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: orderGroups } = await query.graph({
          entity: "order_group",
          filters: { id: completed.data.order_group.id },
          fields: ["id", "orders.id"],
        })
        const { data: orders } = await query.graph({
          entity: "order",
          filters: {
            id: (orderGroups[0] as any).orders.map((o: any) => o.id),
          },
          fields: [
            "id",
            "seller.id",
            "items.id",
            "items.adjustments.promotion_id",
            "shipping_methods.adjustments.promotion_id",
          ],
        })

        const orderA = orders.find(
          (o: any) => o.seller?.id === sellerA.sellerId
        ) as any
        const orderB = orders.find(
          (o: any) => o.seller?.id === sellerB.sellerId
        ) as any
        expect(orderA).toBeDefined()
        expect(orderB).toBeDefined()

        const adjustmentsOf = (order: any) => [
          ...order.items.flatMap((i: any) => i.adjustments ?? []),
          ...(order.shipping_methods ?? []).flatMap(
            (sm: any) => sm.adjustments ?? []
          ),
        ]
        expect(adjustmentsOf(orderA).map((a: any) => a.promotion_id)).toContain(
          promotion.id
        )
        expect(adjustmentsOf(orderB)).toHaveLength(0)
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
