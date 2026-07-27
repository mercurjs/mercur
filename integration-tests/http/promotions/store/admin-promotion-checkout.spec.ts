import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Checkout with admin (sellerless) promotion", () => {
      let appContainer: MedusaContainer
      let seller: any
      let sellerHeaders: any
      let storeHeaders: any
      let region: any
      let salesChannel: any
      let offer: any

      const approveSeller = async (sellerId: string) => {
        const sellerModule: any = appContainer.resolve(MercurModules.SELLER)
        await sellerModule.updateSellers({
          id: sellerId,
          status: SellerStatus.OPEN,
        })
      }

      const createShippingPrerequisites = async (headers: any, prefix: string) => {
        const uniqueSuffix = `_${prefix}_${Date.now()}`

        const stockLocation = (
          await api.post(
            `/vendor/stock-locations`,
            { name: `Warehouse${uniqueSuffix}` },
            headers
          )
        ).data.stock_location

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
          { name: `Fulfillment Set${uniqueSuffix}`, type: "shipping" },
          headers
        )

        const updatedLocation = await api.get(
          `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
          headers
        )
        const fulfillmentSet =
          updatedLocation.data.stock_location.fulfillment_sets[0]

        const serviceZone = (
          await api.post(
            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
            {
              name: `Service Zone${uniqueSuffix}`,
              geo_zones: [{ type: "country", country_code: "us" }],
            },
            headers
          )
        ).data.fulfillment_set.service_zones.find(
          (z: any) => z.name === `Service Zone${uniqueSuffix}`
        )

        const shippingProfile = (
          await api.post(
            `/vendor/shipping-profiles`,
            { name: `Shipping Profile${uniqueSuffix}`, type: "default" },
            headers
          )
        ).data.shipping_profile

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

        return { stockLocation, serviceZone, shippingProfile }
      }

      beforeAll(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      beforeEach(async () => {
        const sellerResult = await createSellerUser(appContainer, {
          email: "admin-promo-seller@test.com",
          name: "Admin Promo Seller",
        })
        seller = sellerResult.seller
        sellerHeaders = sellerResult.headers
        await approveSeller(seller.id)

        const customerResult = await createCustomerUser(appContainer, {
          email: "admin-promo-customer@test.com",
          first_name: "Promo",
          last_name: "Customer",
        })

        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
        storeHeaders = {
          headers: { ...storeHeaders.headers, ...customerResult.headers.headers },
        }

        salesChannel = await appContainer
          .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
          .createSalesChannels({ name: "Test Store" })

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

        const prerequisites = await createShippingPrerequisites(
          sellerHeaders,
          "seller"
        )

        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Admin Promo Product",
          sku: `ADMIN-PROMO-${Date.now()}`,
        })
        await api.post(
          `/vendor/sales-channels/${salesChannel.id}/products`,
          { add: [product.id] },
          sellerHeaders
        )

        await api.post(
          `/vendor/shipping-options`,
          {
            name: "Seller Shipping",
            service_zone_id: prerequisites.serviceZone.id,
            shipping_profile_id: prerequisites.shippingProfile.id,
            provider_id: "manual_manual",
            price_type: "flat",
            type: {
              label: "Standard",
              description: "Standard shipping",
              code: "standard",
            },
            prices: [{ currency_code: "usd", amount: 500 }],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
            ],
          },
          sellerHeaders
        )

        offer = (
          await api.post(
            `/vendor/offers`,
            {
              sku: `OF-ADMIN-PROMO-${Date.now()}`,
              variant_id: product.variants[0].id,
              shipping_profile_id: prerequisites.shippingProfile.id,
              inventory_items: [
                {
                  title: "Admin Promo Inventory",
                  required_quantity: 1,
                  stock_levels: [
                    {
                      location_id: prerequisites.stockLocation.id,
                      stocked_quantity: 100,
                    },
                  ],
                },
              ],
              prices: [{ amount: 2000, currency_code: "usd" }],
            },
            sellerHeaders
          )
        ).data.offer
      })

      it("completes checkout when an admin (sellerless) promotion is applied", async () => {
        // Admin/marketplace promotion — not associated with any seller.
        const promotion = (
          await api.post(
            `/admin/promotions`,
            {
              code: "PLATFORM10",
              type: "standard",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "order",
                allocation: "across",
                value: 10,
              },
            },
            adminHeaders
          )
        ).data.promotion

        // Confirm it really has no seller.
        const promotionDetail = await api.get(
          `/admin/promotions/${promotion.id}?fields=%2Bseller.id`,
          adminHeaders
        )
        expect(promotionDetail.data.promotion.seller ?? null).toBeNull()

        let cart = (
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

        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: offer.id, quantity: 1 },
          storeHeaders
        )

        const promoResponse = await api.post(
          `/store/carts/${cart.id}/promotions`,
          { promo_codes: ["PLATFORM10"] },
          storeHeaders
        )
        expect(promoResponse.status).toEqual(200)
        expect(promoResponse.data.cart.promotions).toHaveLength(1)
        expect(promoResponse.data.cart.discount_total).toBeGreaterThan(0)

        const shippingOptions = (
          await api.get(
            `/store/shipping-options?cart_id=${cart.id}`,
            storeHeaders
          )
        ).data.shipping_options as Record<string, any[]>

        for (const [, options] of Object.entries(shippingOptions)) {
          if (options.length > 0) {
            await api.post(
              `/store/carts/${cart.id}/shipping-methods`,
              { option_id: options[0].id },
              storeHeaders
            )
          }
        }

        const paymentCollection = (
          await api.post(
            `/store/payment-collections`,
            { cart_id: cart.id },
            storeHeaders
          )
        ).data.payment_collection

        await api.post(
          `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
          { provider_id: "pp_system_default" },
          storeHeaders
        )

        const completeResponse = await api.post(
          `/store/carts/${cart.id}/complete`,
          {},
          storeHeaders
        )

        expect(completeResponse.status).toEqual(200)
        expect(completeResponse.data.type).toEqual("order_group")
        expect(completeResponse.data.order_group?.id).toBeDefined()
      })
    })
  },
})
