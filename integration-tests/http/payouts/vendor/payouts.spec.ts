import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  CommissionRateType,
  MercurModules,
  PayoutStatus,
} from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createVendorProduct } from "../../../helpers/create-product"
import {
  createOrderPayoutsWorkflow,
  createPayoutAccountWorkflow,
  createPayoutReversalsWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor - Payouts", () => {
      let appContainer: MedusaContainer
      let commissionService: any
      let payoutService: any
      let query: any
      let seller: any
      let sellerHeaders: any
      let storeHeaders: any
      let region: any
      let salesChannel: any
      let product: any
      let offer: any
      let shippingOption: any

      beforeAll(async () => {
        appContainer = getContainer()
        commissionService = appContainer.resolve(MercurModules.COMMISSION)
        payoutService = appContainer.resolve(MercurModules.PAYOUT)
        query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        // Create seller
        const sellerResult = await createSellerUser(appContainer, {
          email: "payout-seller@test.com",
          name: "Payout Test Seller",
        })
        seller = sellerResult.seller
        sellerHeaders = sellerResult.headers

        // Create payout account for seller
        await createPayoutAccountWorkflow(appContainer).run({
          input: {
            seller_id: seller.id,
            data: {},
            context: {},
          },
        })

        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })

        // Create sales channel
        const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
        salesChannel = await salesChannelModule.createSalesChannels({
          name: "Payout Test Store",
        })

        // Create region
        const regionModule = appContainer.resolve<IRegionModuleService>(Modules.REGION)
        region = await regionModule.createRegions({
          name: "Payout Test Region",
          currency_code: "usd",
          countries: ["us"],
        })

        // Link payment provider to region
        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
        await link.create({
          [Modules.REGION]: { region_id: region.id },
          [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
        })

        // Create product with variant. Pricing + inventory live on the offer
        // (see SPEC-002); the product is linked to the sales channel separately.
        product = await createVendorProduct(api, sellerHeaders, {
          title: "Payout Test Product",
          sku: "PAYOUT-TEST-S",
        })
        await api.post(
          `/vendor/sales-channels/${salesChannel.id}/products`,
          { add: [product.id] },
          sellerHeaders
        )

        // Create shipping prerequisites and option
        const shippingPrerequisites = await createShippingPrerequisites(sellerHeaders)
        const shippingOptionResponse = await api.post(
          `/vendor/shipping-options`,
          {
            name: "Payout Test Shipping",
            service_zone_id: shippingPrerequisites.serviceZone.id,
            shipping_profile_id: shippingPrerequisites.shippingProfile.id,
            provider_id: "manual_manual",
            price_type: "flat",
            type: {
              label: "Standard",
              description: "Standard shipping",
              code: "standard",
            },
            prices: [{ currency_code: "usd", amount: 1000 }], // $10
            rules: [
              {
                attribute: "enabled_in_store",
                value: "true",
                operator: "eq",
              },
            ],
          },
          sellerHeaders
        )
        shippingOption = shippingOptionResponse.data.shipping_option

        // Create a store offer for the product (store add-to-cart resolves the
        // variant + price from the offer).
        offer = (
          await api.post(
            `/vendor/offers`,
            {
              sku: "PAYOUT-OFFER-S",
              variant_id: product.variants[0].id,
              shipping_profile_id: shippingPrerequisites.shippingProfile.id,
              inventory_items: [
                {
                  title: "Payout Offer Inventory",
                  required_quantity: 1,
                  stock_levels: [
                    {
                      location_id: shippingPrerequisites.stockLocation.id,
                      stocked_quantity: 100,
                    },
                  ],
                },
              ],
              prices: [{ currency_code: "usd", amount: 10000 }], // $100
            },
            sellerHeaders
          )
        ).data.offer

        const [defaultRate] = await commissionService.listCommissionRates({
          is_default: true,
        })
        await commissionService.updateCommissionRates({
          id: defaultRate.id,
          type: CommissionRateType.PERCENTAGE,
          value: 10,
          is_enabled: true,
        })
      })

      let prerequisiteCounter = 0

      const createShippingPrerequisites = async (headers: any) => {
        const uniqueSuffix = `_payout_${Date.now()}_${++prerequisiteCounter}`

        const locationResponse = await api.post(
          `/vendor/stock-locations`,
          { name: `Payout Warehouse${uniqueSuffix}` },
          headers
        )
        const stockLocation = locationResponse.data.stock_location

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
          {
            name: `Payout Fulfillment Set${uniqueSuffix}`,
            type: "shipping",
          },
          headers
        )

        const updatedLocation = await api.get(
          `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
          headers
        )
        const fulfillmentSet = updatedLocation.data.stock_location.fulfillment_sets[0]

        const serviceZoneResponse = await api.post(
          `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
          {
            name: `Payout Service Zone${uniqueSuffix}`,
            geo_zones: [{ type: "country", country_code: "us" }],
          },
          headers
        )
        const serviceZone = serviceZoneResponse.data.fulfillment_set.service_zones.find(
          (z: any) => z.name === `Payout Service Zone${uniqueSuffix}`
        )

        const shippingProfile = await createShippingProfile(appContainer, {
            name: `Payout Shipping Profile${uniqueSuffix}`,
        })

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
          { add: ["manual_manual"] },
          headers
        )

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          headers
        )

        return {
          stockLocation,
          fulfillmentSet,
          serviceZone,
          shippingProfile,
        }
      }

      const createCart = async () => {
        const response = await api.post(
          `/store/carts`,
          {
            region_id: region.id,
            sales_channel_id: salesChannel.id,
            currency_code: "usd",
          },
          storeHeaders
        )
        return response.data.cart
      }

      const addItemToCart = async (cartId: string, offerId: string, quantity: number) => {
        const response = await api.post(
          `/store/carts/${cartId}/line-items`,
          { offer_id: offerId, quantity },
          storeHeaders
        )
        return response.data.cart
      }

      const updateCartWithAddress = async (cartId: string) => {
        const response = await api.post(
          `/store/carts/${cartId}`,
          {
            email: "payout-test@test.com",
            shipping_address: {
              first_name: "John",
              last_name: "Doe",
              address_1: "123 Main St",
              city: "New York",
              country_code: "us",
              postal_code: "10001",
            },
          },
          storeHeaders
        )
        return response.data.cart
      }

      const addShippingMethodToCart = async (cartId: string, optionId: string) => {
        const response = await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: optionId },
          storeHeaders
        )
        return response.data.cart
      }

      const completeCart = async (cartId: string) => {
        // Create payment collection
        const paymentCollectionResponse = await api.post(
          `/store/payment-collections`,
          { cart_id: cartId },
          storeHeaders
        )
        const paymentCollection = paymentCollectionResponse.data.payment_collection

        // Initialize payment session
        await api.post(
          `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
          { provider_id: "pp_system_default" },
          storeHeaders
        )

        // Complete cart
        const completeResponse = await api.post(
          `/store/carts/${cartId}/complete`,
          {},
          storeHeaders
        )

        return completeResponse.data
      }

      describe("Payout Flow", () => {
        const getOrder = async (orderId: string) => {
          const {
            data: [order],
          } = await query.graph({
            entity: "order",
            fields: [
              "id",
              "total",
              "currency_code",
              "items.id",
              "payment_collections.payments.id",
              "payment_collections.payments.captured_at",
              "cart.payment_collection.payments.id",
            ],
            filters: { id: orderId },
          })
          return order
        }

        const commissionOf = async (order: any) => {
          const { data: lines } = await query.graph({
            entity: "commission_line",
            fields: ["amount"],
            filters: { item_id: order.items.map((item: any) => item.id) },
          })
          return lines.reduce((acc: number, line: any) => acc + Number(line.amount), 0)
        }

        // The cart payment is split onto the orders by a subscriber, after
        // the capture request returns.
        const eventually = async (assertion: () => Promise<void>) => {
          const deadline = Date.now() + 15000
          for (;;) {
            try {
              return await assertion()
            } catch (error) {
              if (Date.now() > deadline) {
                throw error
              }
              await new Promise((r) => setTimeout(r, 250))
            }
          }
        }

        const placeOrder = async (quantity: number) => {
          const cart = await createCart()
          await addItemToCart(cart.id, offer.id, quantity)
          await updateCartWithAddress(cart.id)
          await addShippingMethodToCart(cart.id, shippingOption.id)

          const completeResult = await completeCart(cart.id)
          expect(completeResult.type).toEqual("order_group")

          const {
            data: [orderGroup],
          } = await query.graph({
            entity: "order_group",
            fields: ["orders.id"],
            filters: { id: completeResult.order_group.id },
          })
          return getOrder(orderGroup.orders[0].id)
        }

        const capture = async (order: any) => {
          await api.post(
            `/admin/payments/${order.cart.payment_collection.payments[0].id}/capture`,
            {},
            adminHeaders
          )
          await eventually(async () => {
            const current = await getOrder(order.id)
            expect(current.payment_collections[0]?.payments[0]?.captured_at).toBeTruthy()
          })
          return getOrder(order.id)
        }

        const payOut = (orderIds: string[]) =>
          createOrderPayoutsWorkflow(appContainer).run({
            input: { order_ids: orderIds, required_fulfillment_status: "not_fulfilled" },
          })

        it("pays the seller the order total minus commission and exposes it via /vendor/payouts", async () => {
          const order = await capture(await placeOrder(1))
          const commission = await commissionOf(order)
          expect(commission).toEqual(1000)

          const { result } = await payOut([order.id])
          expect(result.payouts).toHaveLength(1)

          const payout = result.payouts[0]
          expect(payout.order_id).toEqual(order.id)
          expect(payout.status).toEqual(PayoutStatus.PAID)
          expect(Number(payout.amount)).toEqual(Number(order.total) - commission)
          expect(payout.provider_payout_id).toBeTruthy()

          const payoutsResponse = await api.get(`/vendor/payouts`, sellerHeaders)
          expect(payoutsResponse.status).toEqual(200)
          const listed = payoutsResponse.data.payouts.find((p: any) => p.id === payout.id)
          expect(listed).toBeDefined()
          expect(listed.order_id).toEqual(order.id)
          expect(Number(listed.amount)).toEqual(Number(payout.amount))
        })

        it("holds the payout until the payment is captured, then pays the same row", async () => {
          const order = await placeOrder(1)

          await payOut([order.id])
          const [held] = await payoutService.listPayouts({ order_id: order.id })
          expect(held.status).toEqual(PayoutStatus.ON_HOLD)
          expect(held.status_reason).toContain("is not ready yet")

          await capture(order)
          await payOut([order.id])

          const payouts = await payoutService.listPayouts({ order_id: order.id })
          expect(payouts).toHaveLength(1)
          expect(payouts[0].id).toEqual(held.id)
          expect(payouts[0].status).toEqual(PayoutStatus.PAID)
        })

        it("holds the payout until the order reaches the required fulfillment status", async () => {
          const order = await capture(await placeOrder(1))

          await createOrderPayoutsWorkflow(appContainer).run({
            input: { order_ids: [order.id] },
          })

          const [held] = await payoutService.listPayouts({ order_id: order.id })
          expect(held.status).toEqual(PayoutStatus.ON_HOLD)
          expect(held.status_reason).toEqual("Order is not ready yet, status is not_fulfilled")
        })

        it("does not pay an order out twice", async () => {
          const order = await capture(await placeOrder(1))

          await payOut([order.id])
          const { result } = await payOut([order.id])

          expect(result.payouts).toHaveLength(0)
          expect(await payoutService.listPayouts({ order_id: order.id })).toHaveLength(1)
        })

        it("reverses the refunded share net of its commission", async () => {
          const order = await capture(await placeOrder(1))
          const commission = await commissionOf(order)
          const { result } = await payOut([order.id])
          const payout = result.payouts[0]

          await api.post(
            `/admin/payments/${order.payment_collections[0].payments[0].id}/refund`,
            { amount: 5500 },
            adminHeaders
          )

          const reversals = await createPayoutReversalsWorkflow(appContainer).run({
            input: { order_ids: [order.id] },
          })
          expect(reversals.result.reversals).toHaveLength(1)

          const reversal = reversals.result.reversals[0]
          expect(reversal.payout_id).toEqual(payout.id)
          expect(reversal.status).toEqual(PayoutStatus.PAID)
          expect(reversal.refund_id).toBeTruthy()
          expect(Number(reversal.amount)).toEqual(5500 - (commission * 5500) / Number(order.total))

          const again = await createPayoutReversalsWorkflow(appContainer).run({
            input: { order_ids: [order.id] },
          })
          expect(again.result.reversals).toHaveLength(0)

          const detail = await api.get(`/vendor/payouts/${payout.id}`, sellerHeaders)
          expect(detail.data.payout.reversals).toHaveLength(1)
        })

        it("should not expose a payout to another seller", async () => {
          const order = await capture(await placeOrder(1))
          const payout = (await payOut([order.id])).result.payouts[0]

          const other = await createSellerUser(appContainer, {
            email: "other-payout-seller@test.com",
            name: "Other Payout Seller",
          })

          const asOther = await api.get(`/vendor/payouts`, other.headers)
          expect(asOther.status).toEqual(200)
          expect(asOther.data.payouts.map((p: any) => p.id)).not.toContain(payout.id)
          expect(asOther.data.count).toEqual(0)

          const asOwner = await api.get(`/vendor/payouts`, sellerHeaders)
          expect(asOwner.data.payouts.map((p: any) => p.id)).toContain(payout.id)
          expect(asOwner.data.count).toEqual(1)
        })

        it("creates nothing for an order that does not exist", async () => {
          const { result } = await payOut(["order_does_not_exist"])
          expect(result.payouts).toHaveLength(0)
          expect(await payoutService.listPayouts({ order_id: "order_does_not_exist" })).toHaveLength(0)
        })

        it("should create separate payouts for multiple orders", async () => {
          const order1 = await capture(await placeOrder(2))
          const order2 = await capture(await placeOrder(1))

          const { result } = await payOut([order1.id, order2.id])
          const payout1 = result.payouts.find((p: any) => p.order_id === order1.id)
          const payout2 = result.payouts.find((p: any) => p.order_id === order2.id)

          expect(payout1.id).not.toEqual(payout2.id)
          expect(Number(payout1.amount)).toBeGreaterThan(Number(payout2.amount))

          const payoutsResponse = await api.get(`/vendor/payouts`, sellerHeaders)
          const ids = payoutsResponse.data.payouts.map((p: any) => p.id)
          expect(ids).toContain(payout1.id)
          expect(ids).toContain(payout2.id)
        })
      })
    })
  },
})
