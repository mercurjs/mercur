import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  IProductModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  CommissionRateType,
  CommissionRateTarget,
} from "@mercurjs/types"
import { COMMISSION_MODULE } from "@mercurjs/core/modules/commission"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { generatePublishableKey, generateStoreHeaders } from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Store - Cart Commission Lines", () => {
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

      beforeAll(async () => {
        appContainer = getContainer()
        commissionService = appContainer.resolve(COMMISSION_MODULE)
        query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
      })

      beforeEach(async () => {
        // Create seller
        const sellerResult = await createSellerUser(appContainer, {
          email: "commission-seller@test.com",
          name: "Commission Test Seller",
        })
        seller = sellerResult.seller
        sellerHeaders = sellerResult.headers

        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })

        // Create sales channel
        const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
        salesChannel = await salesChannelModule.createSalesChannels({
          name: "Commission Test Store",
        })

        // Create region
        const regionModule = appContainer.resolve<IRegionModuleService>(Modules.REGION)
        region = await regionModule.createRegions({
          name: "Commission Test Region",
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
            title: "Commission Test Product",
            description: "A test product for commission",
            options: [{ title: "Size", values: ["S", "M"] }],
            variants: [
              {
                title: "Small",
                sku: "COMM-TEST-S",
                options: { Size: "S" },
                prices: [{ currency_code: "usd", amount: 10000 }], // $100
                manage_inventory: false,
              },
              {
                title: "Medium",
                sku: "COMM-TEST-M",
                options: { Size: "M" },
                prices: [{ currency_code: "usd", amount: 5000 }], // $50
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
            name: "Commission Test Shipping",
            service_zone_id: shippingPrerequisites.serviceZone.id,
            shipping_profile_id: shippingPrerequisites.shippingProfile.id,
            provider_id: "manual_manual",
            price_type: "flat",
            type: {
              label: "Standard",
              description: "Standard shipping",
              code: "standard",
            },
            prices: [{ currency_code: "usd", amount: 2000 }], // $20
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
      })

      let prerequisiteCounter = 0

      const createShippingPrerequisites = async (headers: any) => {
        const uniqueSuffix = `_comm_${Date.now()}_${++prerequisiteCounter}`

        const locationResponse = await api.post(
          `/vendor/stock-locations`,
          { name: `Commission Warehouse${uniqueSuffix}` },
          headers
        )
        const stockLocation = locationResponse.data.stock_location

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
          {
            name: `Commission Fulfillment Set${uniqueSuffix}`,
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
            name: `Commission Service Zone${uniqueSuffix}`,
            geo_zones: [{ type: "country", country_code: "us" }],
          },
          headers
        )
        const serviceZone = serviceZoneResponse.data.fulfillment_set.service_zones.find(
          (z: any) => z.name === `Commission Service Zone${uniqueSuffix}`
        )

        const shippingProfileResponse = await api.post(
          `/vendor/shipping-profiles`,
          {
            name: `Commission Shipping Profile${uniqueSuffix}`,
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
            email: "commission-test@test.com",
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



      describe("1. Basic Item Commission", () => {
        it("1.1 should apply percentage-based item commission and calculate correct amount", async () => {
          // Create 10% commission rate
          await commissionService.createCommissionRates({
            name: "Standard Item Commission",
            code: "ITEM_10_PCT",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          // Get commission lines using the service
          // Item subtotal is $100 (10000 cents), 10% = $10 (1000 cents)
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: 10000, // $100 in cents
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("ITEM_10_PCT")
          expect(commissionLines[0].rate).toEqual(10)
          expect(commissionLines[0].amount).toEqual(1000) // 10% of $100 = $10 (1000 cents)
        })

        it("1.2 should apply fixed-rate item commission and return fixed amount", async () => {
          // Create $5 fixed commission rate
          await commissionService.createCommissionRates({
            name: "Fixed Item Commission",
            code: "ITEM_5_FIXED",
            type: CommissionRateType.FIXED,
            target: CommissionRateTarget.ITEM,
            value: 500, // $5 in cents
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: 10000, // $100 in cents (doesn't affect fixed rate)
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("ITEM_5_FIXED")
          expect(commissionLines[0].rate).toEqual(500)
          expect(commissionLines[0].amount).toEqual(500) // Fixed $5 (500 cents)
        })
      })

      describe("2. Shipping Commission", () => {
        it("2.1 should apply percentage-based shipping commission and calculate correct amount", async () => {
          // Create 15% shipping commission rate
          await commissionService.createCommissionRates({
            name: "Standard Shipping Commission",
            code: "SHIP_15_PCT",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.SHIPPING,
            value: 15,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          await addItemToCart(cart.id, product.variants[0].id, 1)
          await updateCartWithAddress(cart.id)
          const cartWithShipping = await addShippingMethodToCart(cart.id, shippingOption.id)

          // Shipping is $20 (2000 cents), 15% = $3 (300 cents)
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: [],
            shipping_methods: cartWithShipping.shipping_methods.map((sm: any) => ({
              id: sm.id,
              subtotal: 2000, // $20 in cents
              shipping_option: { shipping_option_type_id: sm.shipping_option?.type?.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("SHIP_15_PCT")
          expect(commissionLines[0].rate).toEqual(15)
          expect(commissionLines[0].amount).toEqual(300) // 15% of $20 = $3 (300 cents)
        })

        it("2.2 should apply fixed-rate shipping commission and return fixed amount", async () => {
          // Create $2 fixed shipping commission
          await commissionService.createCommissionRates({
            name: "Fixed Shipping Commission",
            code: "SHIP_2_FIXED",
            type: CommissionRateType.FIXED,
            target: CommissionRateTarget.SHIPPING,
            value: 200, // $2 in cents
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          await addItemToCart(cart.id, product.variants[0].id, 1)
          await updateCartWithAddress(cart.id)
          const cartWithShipping = await addShippingMethodToCart(cart.id, shippingOption.id)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: [],
            shipping_methods: cartWithShipping.shipping_methods.map((sm: any) => ({
              id: sm.id,
              subtotal: 2000, // $20 in cents
              shipping_option: { shipping_option_type_id: sm.shipping_option?.type?.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("SHIP_2_FIXED")
          expect(commissionLines[0].rate).toEqual(200)
          expect(commissionLines[0].amount).toEqual(200) // Fixed $2 (200 cents)
        })
      })

      describe("3. Rule-Based Overrides", () => {
        it("3.1 should apply product-specific override", async () => {
          // Create default rate 10%
          await commissionService.createCommissionRates({
            name: "Default Rate",
            code: "DEFAULT_10",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: true,
            priority: 0,
          })

          // Create product-specific override 5%
          await commissionService.createCommissionRates({
            name: "Product Override",
            code: "PROD_OVERRIDE_5",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 5,
            is_enabled: true,
            priority: 10,
            rules: [{ reference: "product", reference_id: product.id }],
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("PROD_OVERRIDE_5")
          expect(commissionLines[0].rate).toEqual(5)
        })

        it("3.5 should apply seller-specific override", async () => {
          // Create default rate 10%
          await commissionService.createCommissionRates({
            name: "Default Rate",
            code: "DEFAULT_10_SELLER",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: true,
            priority: 0,
          })

          // Create seller-specific override 6%
          await commissionService.createCommissionRates({
            name: "VIP Seller Override",
            code: "SELLER_VIP_6",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 6,
            is_enabled: true,
            priority: 10,
            rules: [{ reference: "seller", reference_id: seller.id }],
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id, seller: { id: seller.id } },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("SELLER_VIP_6")
          expect(commissionLines[0].rate).toEqual(6)
        })
      })

      describe("4. Priority Ordering", () => {
        it("4.1 should apply higher priority rate", async () => {
          // Rate A: 10%, priority = 0 (default)
          await commissionService.createCommissionRates({
            name: "Default Rate",
            code: "PRIORITY_DEFAULT",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: true,
            priority: 0,
          })

          // Rate B: 5%, priority = 10, rule: seller
          await commissionService.createCommissionRates({
            name: "High Priority Seller Rate",
            code: "PRIORITY_HIGH_SELLER",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 5,
            is_enabled: true,
            priority: 10,
            rules: [{ reference: "seller", reference_id: seller.id }],
          })

          // Rate C: 8%, priority = 5, rule: product
          await commissionService.createCommissionRates({
            name: "Medium Priority Product Rate",
            code: "PRIORITY_MED_PRODUCT",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 8,
            is_enabled: true,
            priority: 5,
            rules: [{ reference: "product", reference_id: product.id }],
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          // Item matches both seller and product rules, highest priority (10) wins
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id, seller: { id: seller.id } },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("PRIORITY_HIGH_SELLER")
          expect(commissionLines[0].rate).toEqual(5)
        })
      })

      describe("5. Minimum Commission", () => {
        it("5.1 should apply minimum when calculated is below", async () => {
          // 2% commission with $1 minimum
          await commissionService.createCommissionRates({
            name: "Low Rate With Minimum",
            code: "MIN_COMM_1",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 2,
            min_amount: 100, // $1 minimum (100 cents)
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[1].id, 1)

          // $10 subtotal -> 2% = $0.20 (20 cents), but min is $1 (100 cents)
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: 1000, // $10 in cents
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("MIN_COMM_1")
          expect(commissionLines[0].rate).toEqual(2)
          expect(commissionLines[0].amount).toEqual(100) // Min $1 applied (100 cents)
        })

        it("5.2 should not apply minimum when calculated is above", async () => {
          // 10% commission with $1 minimum
          await commissionService.createCommissionRates({
            name: "Rate Above Minimum",
            code: "ABOVE_MIN",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            min_amount: 100, // $1 minimum (100 cents)
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          // $100 subtotal -> 10% = $10 (1000 cents), above $1 minimum
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: 10000, // $100 in cents
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("ABOVE_MIN")
          expect(commissionLines[0].rate).toEqual(10)
          expect(commissionLines[0].amount).toEqual(1000) // 10% of $100 = $10 (1000 cents)
        })

        it("5.3 should apply minimum on fixed rate when below", async () => {
          // $0.50 fixed commission with $1 minimum
          await commissionService.createCommissionRates({
            name: "Low Fixed With Minimum",
            code: "FIXED_MIN",
            type: CommissionRateType.FIXED,
            target: CommissionRateTarget.ITEM,
            value: 50, // $0.50 (50 cents)
            min_amount: 100, // $1 minimum (100 cents)
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: 10000, // $100 in cents
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("FIXED_MIN")
          expect(commissionLines[0].rate).toEqual(50)
          expect(commissionLines[0].amount).toEqual(100) // Min $1 applied (100 cents)
        })
      })

      describe("6. Include Tax", () => {
        it("6.1 should include tax in calculation when enabled", async () => {
          // 10% commission with include_tax = true
          await commissionService.createCommissionRates({
            name: "Rate With Tax",
            code: "INCLUDE_TAX",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            include_tax: true,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          // Commission calculated on $100 + $10 tax = $110 -> 10% = $11 (1100 cents)
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: 10000, // $100 in cents
              tax_total: 1000, // $10 tax in cents
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("INCLUDE_TAX")
          expect(commissionLines[0].rate).toEqual(10)
          expect(commissionLines[0].amount).toEqual(1100) // 10% of ($100 + $10 tax) = $11 (1100 cents)
        })

        it("6.2 should not include tax when disabled", async () => {
          // 10% commission with include_tax = false
          await commissionService.createCommissionRates({
            name: "Rate Without Tax",
            code: "EXCLUDE_TAX",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            include_tax: false,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          // Commission calculated on $100 only -> 10% = $10 (1000 cents)
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: 10000, // $100 in cents
              tax_total: 1000, // $10 tax in cents (ignored)
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("EXCLUDE_TAX")
          expect(commissionLines[0].rate).toEqual(10)
          expect(commissionLines[0].amount).toEqual(1000) // 10% of $100 = $10 (1000 cents), tax ignored
        })

        it("6.3 should include tax on shipping commission", async () => {
          // 10% shipping commission with include_tax = true
          await commissionService.createCommissionRates({
            name: "Shipping With Tax",
            code: "SHIP_INCLUDE_TAX",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.SHIPPING,
            value: 10,
            include_tax: true,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          await addItemToCart(cart.id, product.variants[0].id, 1)
          await updateCartWithAddress(cart.id)
          const cartWithShipping = await addShippingMethodToCart(cart.id, shippingOption.id)

          // Commission calculated on $20 + $2 tax = $22 -> 10% = $2.20 (220 cents)
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: [],
            shipping_methods: cartWithShipping.shipping_methods.map((sm: any) => ({
              id: sm.id,
              subtotal: 2000, // $20 in cents
              tax_total: 200, // $2 tax in cents
              shipping_option: { shipping_option_type_id: sm.shipping_option?.type?.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("SHIP_INCLUDE_TAX")
          expect(commissionLines[0].rate).toEqual(10)
          expect(commissionLines[0].amount).toEqual(220) // 10% of ($20 + $2 tax) = $2.20 (220 cents)
        })
      })

      describe("7. Currency Code Matching", () => {
        it("7.1 should apply currency-specific rate when matches", async () => {
          // USD rate 10%
          await commissionService.createCommissionRates({
            name: "USD Rate",
            code: "USD_RATE",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            currency_code: "usd",
            is_enabled: true,
            priority: 10,
          })

          // EUR rate 12%
          await commissionService.createCommissionRates({
            name: "EUR Rate",
            code: "EUR_RATE",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 12,
            currency_code: "eur",
            is_enabled: true,
            priority: 10,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("USD_RATE")
        })

        it("7.2 should fall back to rate without currency when specific doesn't match", async () => {
          // EUR rate 10%
          await commissionService.createCommissionRates({
            name: "EUR Only Rate",
            code: "EUR_ONLY",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            currency_code: "eur",
            is_enabled: true,
            priority: 10,
          })

          // Any currency rate 8%
          await commissionService.createCommissionRates({
            name: "Any Currency Rate",
            code: "ANY_CURRENCY",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 8,
            currency_code: null,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          // Cart is USD, EUR rate won't match, should use ANY_CURRENCY
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("ANY_CURRENCY")
        })

        it("7.3 should not create commission line when no currency matches", async () => {
          // EUR only rate
          await commissionService.createCommissionRates({
            name: "EUR Only",
            code: "EUR_ONLY_STRICT",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            currency_code: "eur",
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          // Cart is USD, no matching rate
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(0)
        })
      })

      describe("8. Default Rate (No Rules)", () => {
        it("8.1 should apply default rate when no specific rules match", async () => {
          // Specific product rule (won't match)
          await commissionService.createCommissionRates({
            name: "Specific Product Rate",
            code: "SPECIFIC_PROD",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 5,
            is_enabled: true,
            priority: 10,
            rules: [{ reference: "product", reference_id: "prod_nonexistent" }],
          })

          // Default rate (no rules)
          await commissionService.createCommissionRates({
            name: "Default Rate",
            code: "DEFAULT_RATE",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("DEFAULT_RATE")
        })

        it("8.2 should apply specific rule over default", async () => {
          // Specific seller rule
          await commissionService.createCommissionRates({
            name: "Seller Rate",
            code: "SELLER_SPECIFIC",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 5,
            is_enabled: true,
            priority: 10,
            rules: [{ reference: "seller", reference_id: seller.id }],
          })

          // Default rate (no rules)
          await commissionService.createCommissionRates({
            name: "Default Rate",
            code: "DEFAULT_FALLBACK",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id, seller: { id: seller.id } },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("SELLER_SPECIFIC")
        })
      })

      describe("9. Edge Cases", () => {
        it("9.1 should return no commission lines when no matching rates", async () => {
          // Only shipping rate, no item rate
          await commissionService.createCommissionRates({
            name: "Shipping Only",
            code: "SHIPPING_ONLY",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.SHIPPING,
            value: 15,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id },
            })),
            shipping_methods: [],
          })

          expect(commissionLines).toHaveLength(0)
        })

        it("9.2 should return empty array for empty cart", async () => {
          await commissionService.createCommissionRates({
            name: "Default",
            code: "EMPTY_CART_DEFAULT",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: true,
            priority: 0,
          })

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: [],
            shipping_methods: [],
          })

          expect(commissionLines).toHaveLength(0)
        })

        it("9.4 should handle multiple items with different rates and calculate correct amounts", async () => {
          // Create second seller
          const seller2Result = await createSellerUser(appContainer, {
            email: "commission-seller2@test.com",
            name: "Commission Test Seller 2",
          })
          const seller2 = seller2Result.seller

          // Seller 1 rate 5%
          await commissionService.createCommissionRates({
            name: "Seller 1 Rate",
            code: "SELLER1_5",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 5,
            is_enabled: true,
            priority: 10,
            rules: [{ reference: "seller", reference_id: seller.id }],
          })

          // Seller 2 rate 8%
          await commissionService.createCommissionRates({
            name: "Seller 2 Rate",
            code: "SELLER2_8",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 8,
            is_enabled: true,
            priority: 10,
            rules: [{ reference: "seller", reference_id: seller2.id }],
          })

          // Default rate 10%
          await commissionService.createCommissionRates({
            name: "Default Rate",
            code: "DEFAULT_10_MULTI",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: true,
            priority: 0,
          })

          // Each item has $100 subtotal
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: [
              { id: "item_1", subtotal: 10000, product: { id: "prod_1", seller: { id: seller.id } } }, // 5% of $100 = $5
              { id: "item_2", subtotal: 10000, product: { id: "prod_2", seller: { id: seller2.id } } }, // 8% of $100 = $8
              { id: "item_3", subtotal: 10000, product: { id: "prod_3" } }, // 10% of $100 = $10 (default)
            ],
          })

          expect(commissionLines).toHaveLength(3)

          const seller1Line = commissionLines.find(l => l.item_id === "item_1")
          const seller2Line = commissionLines.find(l => l.item_id === "item_2")
          const defaultLine = commissionLines.find(l => l.item_id === "item_3")

          expect(seller1Line?.code).toEqual("SELLER1_5")
          expect(seller1Line?.amount).toEqual(500) // 5% of $100 = $5 (500 cents)

          expect(seller2Line?.code).toEqual("SELLER2_8")
          expect(seller2Line?.amount).toEqual(800) // 8% of $100 = $8 (800 cents)

          expect(defaultLine?.code).toEqual("DEFAULT_10_MULTI")
          expect(defaultLine?.amount).toEqual(1000) // 10% of $100 = $10 (1000 cents)
        })

        it("9.5 should ignore disabled rates", async () => {
          // Disabled rate
          await commissionService.createCommissionRates({
            name: "Disabled Rate",
            code: "DISABLED_RATE",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: false,
            priority: 10,
          })

          // Enabled rate
          await commissionService.createCommissionRates({
            name: "Enabled Rate",
            code: "ENABLED_RATE",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 15,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          const updatedCart = await addItemToCart(cart.id, product.variants[0].id, 1)

          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: updatedCart.items.map((item: any) => ({
              id: item.id,
              subtotal: item.subtotal,
              product: { id: product.id },
            })),
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("ENABLED_RATE")
        })
      })

      describe("10. Combined Scenarios", () => {
        it("10.1 should handle full cart with items and shipping and calculate correct amounts", async () => {
          // Item commission 10%
          await commissionService.createCommissionRates({
            name: "Item Commission",
            code: "COMBINED_ITEM",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 10,
            is_enabled: true,
            priority: 0,
          })

          // Shipping commission 15%
          await commissionService.createCommissionRates({
            name: "Shipping Commission",
            code: "COMBINED_SHIPPING",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.SHIPPING,
            value: 15,
            is_enabled: true,
            priority: 0,
          })

          const cart = await createCart()
          await addItemToCart(cart.id, product.variants[0].id, 1) // $100
          await addItemToCart(cart.id, product.variants[1].id, 1) // $50
          await updateCartWithAddress(cart.id)
          const cartWithShipping = await addShippingMethodToCart(cart.id, shippingOption.id)

          // Item 1: $100 -> 10% = $10
          // Item 2: $50 -> 10% = $5
          // Shipping: $20 -> 15% = $3
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: [
              { id: "item_100", subtotal: 10000, product: { id: product.id } }, // $100
              { id: "item_50", subtotal: 5000, product: { id: product.id } }, // $50
            ],
            shipping_methods: cartWithShipping.shipping_methods.map((sm: any) => ({
              id: sm.id,
              subtotal: 2000, // $20
            })),
          })

          // 2 item commission lines + 1 shipping commission line
          expect(commissionLines).toHaveLength(3)

          const item100Line = commissionLines.find(l => l.item_id === "item_100")
          const item50Line = commissionLines.find(l => l.item_id === "item_50")
          const shippingLine = commissionLines.find(l => l.code === "COMBINED_SHIPPING")

          expect(item100Line?.code).toEqual("COMBINED_ITEM")
          expect(item100Line?.amount).toEqual(1000) // 10% of $100 = $10 (1000 cents)

          expect(item50Line?.code).toEqual("COMBINED_ITEM")
          expect(item50Line?.amount).toEqual(500) // 10% of $50 = $5 (500 cents)

          expect(shippingLine?.code).toEqual("COMBINED_SHIPPING")
          expect(shippingLine?.amount).toEqual(300) // 15% of $20 = $3 (300 cents)
        })

        it("10.3 should apply correct rate in complex override hierarchy and calculate amount", async () => {
          // Product type rate 7%
          await commissionService.createCommissionRates({
            name: "Product Type Rate",
            code: "TYPE_7",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 7,
            is_enabled: true,
            priority: 5,
            rules: [{ reference: "product_type", reference_id: "ptyp_electronics" }],
          })

          // Category rate 8%
          await commissionService.createCommissionRates({
            name: "Category Rate",
            code: "CATEGORY_8",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 8,
            is_enabled: true,
            priority: 7,
            rules: [{ reference: "product_category", reference_id: "pcat_premium" }],
          })

          // Seller VIP rate 6% (highest priority)
          await commissionService.createCommissionRates({
            name: "VIP Seller Rate",
            code: "SELLER_VIP_6_COMPLEX",
            type: CommissionRateType.PERCENTAGE,
            target: CommissionRateTarget.ITEM,
            value: 6,
            is_enabled: true,
            priority: 10,
            rules: [{ reference: "seller", reference_id: seller.id }],
          })

          // Item has all three: seller_vip, category_premium, type_electronics
          // Seller rate should win (priority 10)
          // $100 subtotal -> 6% = $6 (600 cents)
          const commissionLines = await commissionService.getCommissionLines({
            currency_code: "usd",
            items: [{
              id: "item_complex",
              subtotal: 10000, // $100 in cents
              product: {
                id: product.id,
                type_id: "ptyp_electronics",
                categories: [{ id: "pcat_premium" }],
                seller: { id: seller.id },
              },
            }],
          })

          expect(commissionLines).toHaveLength(1)
          expect(commissionLines[0].code).toEqual("SELLER_VIP_6_COMPLEX")
          expect(commissionLines[0].rate).toEqual(6)
          expect(commissionLines[0].amount).toEqual(600) // 6% of $100 = $6 (600 cents)
        })
      })
    })
  },
})
