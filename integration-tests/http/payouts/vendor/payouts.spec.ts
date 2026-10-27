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
} from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { generatePublishableKey, generateStoreHeaders } from "../../../helpers/create-admin-user"
import { createVendorProduct } from "../../../helpers/create-product"
import {
    createScopedAdminHeaders,
    createShippingRuleAndEnable,
} from "../../../helpers/shipping-rules"
import { createPayoutAccountWorkflow, createPayoutWorkflow } from '@mercurjs/core/workflows'

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Payouts", () => {
      let appContainer: MedusaContainer
      let commissionService: any
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
        query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
      })

      beforeEach(async () => {
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
        const shippingOptionResponse = await createShippingRuleAndEnable(api, {
          adminHeaders: await createScopedAdminHeaders(appContainer),
          sellerHeaders,
          stockLocationId: shippingPrerequisites.stockLocation.id,
          shippingProfileId: shippingPrerequisites.shippingProfile.id,
          countryCodes: ["us"],
          prices: [{ currency_code: "usd", amount: 1000 }],
        })
        shippingOption = shippingOptionResponse.shippingOption

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

        const shippingProfile = await createShippingProfile(appContainer, {
            name: `Payout Shipping Profile${uniqueSuffix}`,
        })

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          headers
        )

        return {
          stockLocation,
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
        const getOrderFromGroup = async (orderGroupId: string) => {
          const { data: [orderGroup] } = await query.graph({
            entity: "order_group",
            fields: ["id", "orders.*", "orders.items.*"],
            filters: { id: orderGroupId },
          })
          const order = orderGroup.orders[0]

          const itemIds = (order.items ?? [])
            .map((item: any) => item.id)
            .filter(Boolean)
          if (itemIds.length) {
            const { data: commissionLines } = await query.graph({
              entity: "commission_line",
              fields: [
                "id",
                "item_id",
                "shipping_method_id",
                "code",
                "rate",
                "amount",
              ],
              filters: { item_id: itemIds },
            })
            for (const item of order.items) {
              item.commission_lines = commissionLines.filter(
                (line: any) => line.item_id === item.id
              )
            }
          }

          return order
        }

        const placeOrder = async (quantity: number) => {
          const cart = await createCart()
          await addItemToCart(cart.id, offer.id, quantity)
          await updateCartWithAddress(cart.id)
          await addShippingMethodToCart(cart.id, shippingOption.id)

          const completeResult = await completeCart(cart.id)
          expect(completeResult.type).toEqual("order_group")

          return getOrderFromGroup(completeResult.order_group.id)
        }

        it("should create a payout for an order and expose it via /vendor/payouts", async () => {
          const order = await placeOrder(1) // $100 item + $10 shipping

          expect(order).toBeDefined()
          expect(order.items).toHaveLength(1)

          // Commission (10% of the $100 item) is recorded on the order item.
          const commissionLine = order.items[0].commission_lines?.[0]
          expect(commissionLine).toBeDefined()
          expect(commissionLine.amount).toEqual(1000) // $10 in cents

          // Create the payout directly from the order.
          const payoutResult = await createPayoutWorkflow(appContainer).run({
            input: { order_id: order.id },
          })

          const payout = payoutResult.result
          expect(payout).toBeDefined()
          expect(payout.id).toBeDefined()
          expect(Number(payout.amount)).toBeGreaterThan(0)
          expect(payout.currency_code).toEqual("usd")

          // The seller can see the payout on their payouts endpoint.
          const payoutsResponse = await api.get(`/vendor/payouts`, sellerHeaders)

          expect(payoutsResponse.status).toEqual(200)
          const listed = payoutsResponse.data.payouts.find(
            (p: any) => p.id === payout.id
          )
          expect(listed).toBeDefined()
          expect(Number(listed.amount)).toEqual(Number(payout.amount))
          expect(listed.currency_code).toEqual("usd")
        })

        it("should not expose a payout to another seller", async () => {
          const order = await placeOrder(1)
          const payout = (
            await createPayoutWorkflow(appContainer).run({
              input: { order_id: order.id },
            })
          ).result

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

        it("should reject creating a payout for a non-existent order", async () => {
          const { errors } = await createPayoutWorkflow(appContainer).run({
            input: { order_id: "order_does_not_exist" },
            throwOnError: false,
          })

          expect(errors.length).toBeGreaterThan(0)
        })

        it("should create separate payouts for multiple orders", async () => {
          const order1 = await placeOrder(2) // 2 x $100
          const payout1 = (
            await createPayoutWorkflow(appContainer).run({
              input: { order_id: order1.id },
            })
          ).result

          const order2 = await placeOrder(1) // 1 x $100
          const payout2 = (
            await createPayoutWorkflow(appContainer).run({
              input: { order_id: order2.id },
            })
          ).result

          expect(payout1.id).not.toEqual(payout2.id)
          expect(Number(payout1.amount)).toBeGreaterThan(0)
          expect(Number(payout2.amount)).toBeGreaterThan(0)

          // The larger order should yield the larger payout.
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
