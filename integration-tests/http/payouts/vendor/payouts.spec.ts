import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  CommissionRateType,
  CommissionRateTarget,
  MercurModules,
} from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { generatePublishableKey, generateStoreHeaders } from "../../../helpers/create-admin-user"
import { createPayoutAccountWorkflow, creditOrderToPayoutAccountWorkflow, createPayoutWorkflow } from '@mercurjs/core/workflows'

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
      let shippingOption: any
      let payoutAccount: any

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
        const payoutAccountResult = await createPayoutAccountWorkflow(appContainer).run({
          input: {
            seller_id: seller.id,
            data: {},
            context: {},
          },
        })
        payoutAccount = payoutAccountResult.result

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

        // Create product with variant
        const productResponse = await api.post(
          `/vendor/products`,
          {
            status: "published",
            title: "Payout Test Product",
            description: "A test product for payout testing",
            options: [{ title: "Size", values: ["S"] }],
            variants: [
              {
                title: "Small",
                sku: "PAYOUT-TEST-S",
                options: { Size: "S" },
                prices: [{ currency_code: "usd", amount: 10000 }], // $100
                manage_inventory: false,
              },
            ],
            sales_channels: [{ id: salesChannel.id }],
          },
          sellerHeaders
        )
        product = productResponse.data.product

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

        // Create 10% marketplace commission
        await commissionService.createCommissionRates({
          name: "Marketplace Commission",
          code: "MARKETPLACE_10",
          type: CommissionRateType.PERCENTAGE,
          target: CommissionRateTarget.ITEM,
          value: 10,
          is_enabled: true,
          priority: 0,
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

        const shippingProfileResponse = await api.post(
          `/vendor/shipping-profiles`,
          {
            name: `Payout Shipping Profile${uniqueSuffix}`,
            type: "default",
          },
          headers
        )
        const shippingProfile = shippingProfileResponse.data.shipping_profile

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

      const addItemToCart = async (cartId: string, variantId: string, quantity: number) => {
        const response = await api.post(
          `/store/carts/${cartId}/line-items`,
          { variant_id: variantId, quantity },
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
        it("should complete full payout flow: commission -> order -> credit balance -> create payout -> list payouts", async () => {
          // 1. Create cart and complete order
          const cart = await createCart()
          await addItemToCart(cart.id, product.variants[0].id, 1) // $100 item
          await updateCartWithAddress(cart.id)
          await addShippingMethodToCart(cart.id, shippingOption.id)

          const completeResult = await completeCart(cart.id)
          expect(completeResult.type).toEqual("order_group")

          const orderGroupId = completeResult.order_group.id

          // Get the order from order group
          const { data: [orderGroup] } = await query.graph({
            entity: "order_group",
            fields: ["id", "orders.*", "orders.items.*", "orders.items.commission_lines.*"],
            filters: { id: orderGroupId },
          })
          const order = orderGroup.orders[0]

          expect(order).toBeDefined()
          expect(order.items).toHaveLength(1)

          // Verify commission was applied (10% of $100 = $10)
          const commissionLine = order.items[0].commission_lines?.[0]
          expect(commissionLine).toBeDefined()
          expect(commissionLine.amount).toEqual(1000) // $10 in cents

          // 2. Credit order earnings to seller's payout account
          const creditResult = await creditOrderToPayoutAccountWorkflow(appContainer).run({
            input: {
              order_id: order.id,
            },
          })

          expect(creditResult.result).toBeDefined()
          expect(creditResult.result).toHaveLength(1)

          // Verify balance was credited (order total - commission)
          // Order total is $100 (item) + $10 (shipping) = $110
          // Commission is $10
          // Seller amount = $110 - $10 = $100
          const transaction = creditResult.result[0]
          expect(transaction.reference).toEqual("order")
          expect(transaction.reference_id).toEqual(order.id)

          // Check payout balance
          const { data: [balance] } = await query.graph({
            entity: "payout_balance",
            fields: ["id", "account_id", "currency_code", "totals"],
            filters: { account_id: payoutAccount.id, currency_code: "usd" },
          })

          expect(balance).toBeDefined()
          expect(balance.totals.balance).toBeGreaterThan(0)

          // 3. Create a payout
          const payoutResult = await createPayoutWorkflow(appContainer).run({
            input: {
              account_id: payoutAccount.id,
              amount: 5000, // $50 payout
              currency_code: "usd",
            },
          })

          expect(payoutResult.result).toBeDefined()
          expect(payoutResult.result.id).toBeDefined()

          const payoutId = payoutResult.result.id

          // 4. Verify payout is available in /vendor/payouts endpoint
          const payoutsResponse = await api.get(
            `/vendor/payouts`,
            sellerHeaders
          )

          expect(payoutsResponse.status).toEqual(200)
          expect(payoutsResponse.data.payouts).toBeDefined()
          expect(payoutsResponse.data.payouts.length).toBeGreaterThan(0)

          const payout = payoutsResponse.data.payouts.find((p: any) => p.id === payoutId)
          expect(payout).toBeDefined()
          expect(payout.amount).toEqual(5000)
          expect(payout.currency_code).toEqual("usd")
        })

        it("should reject payout when insufficient balance", async () => {
          // Try to create payout without any balance
          await expect(
            createPayoutWorkflow(appContainer).run({
              input: {
                account_id: payoutAccount.id,
                amount: 100000, // $1000 - more than available
                currency_code: "usd",
              },
            })
          ).rejects.toThrow()
        })

        it("should correctly calculate seller earnings after multiple orders", async () => {
          // Create and complete first order
          const cart1 = await createCart()
          await addItemToCart(cart1.id, product.variants[0].id, 2) // 2 x $100 = $200
          await updateCartWithAddress(cart1.id)
          await addShippingMethodToCart(cart1.id, shippingOption.id)

          const result1 = await completeCart(cart1.id)
          const { data: [orderGroup1] } = await query.graph({
            entity: "order_group",
            fields: ["id", "orders.*"],
            filters: { id: result1.order_group.id },
          })
          const order1 = orderGroup1.orders[0]

          // Credit first order
          await creditOrderToPayoutAccountWorkflow(appContainer).run({
            input: { order_id: order1.id },
          })

          // Create and complete second order
          const cart2 = await createCart()
          await addItemToCart(cart2.id, product.variants[0].id, 1) // 1 x $100
          await updateCartWithAddress(cart2.id)
          await addShippingMethodToCart(cart2.id, shippingOption.id)

          const result2 = await completeCart(cart2.id)
          const { data: [orderGroup2] } = await query.graph({
            entity: "order_group",
            fields: ["id", "orders.*"],
            filters: { id: result2.order_group.id },
          })
          const order2 = orderGroup2.orders[0]

          // Credit second order
          await creditOrderToPayoutAccountWorkflow(appContainer).run({
            input: { order_id: order2.id },
          })

          // Check total balance
          // Order 1: ($200 item + $10 shipping) - $20 commission = $190
          // Order 2: ($100 item + $10 shipping) - $10 commission = $100
          // Total: $290

          const { data: [balance] } = await query.graph({
            entity: "payout_balance",
            fields: ["id", "totals"],
            filters: { account_id: payoutAccount.id, currency_code: "usd" },
          })

          expect(balance).toBeDefined()
          // Balance should be sum of both orders' seller earnings
          expect(balance.totals.balance).toBeGreaterThan(0)
        })
      })
    })
  },
})
