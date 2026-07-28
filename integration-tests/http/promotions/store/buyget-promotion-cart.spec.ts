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
    describe("Store - Cart buyget promotion", () => {
      let appContainer: MedusaContainer
      let storeHeaders: any
      let region: any
      let salesChannel: any
      let sellerHeaders: any

      const seedOffer = async (opts: {
        name: string
        offerPrice: number
        offerSku: string
        headers: any
      }) => {
        const tag = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        const headers = opts.headers

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
          sku: `${opts.offerSku}-V-${tag}`,
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

        return { offer }
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

        const seller = await createSellerUser(appContainer, {
          email: `buyget-cart-${Date.now()}@test.com`,
          name: "Buyget Cart Seller",
        })
        sellerHeaders = seller.headers
      })

      it("discounts the 'get' offer when the 'buy' offer is in the cart", async () => {
        const buy = await seedOffer({
          name: "Buy",
          offerPrice: 2000,
          offerSku: `BUYGET-BUY-${Date.now()}`,
          headers: sellerHeaders,
        })
        const get = await seedOffer({
          name: "Get",
          offerPrice: 1000,
          offerSku: `BUYGET-GET-${Date.now()}`,
          headers: sellerHeaders,
        })

        await api.post(
          `/vendor/promotions`,
          {
            code: "BUYGETCART",
            type: "buyget",
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "items",
              allocation: "each",
              value: 100,
              max_quantity: 1,
              apply_to_quantity: 1,
              buy_rules_min_quantity: 1,
              target_rules: [
                {
                  attribute: "items.metadata.offer_id",
                  operator: "in",
                  values: [get.offer.id],
                },
              ],
              buy_rules: [
                {
                  attribute: "items.metadata.offer_id",
                  operator: "in",
                  values: [buy.offer.id],
                },
              ],
            },
          },
          sellerHeaders
        )

        const cart = await createCart()

        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: buy.offer.id, quantity: 1 },
          storeHeaders
        )
        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: get.offer.id, quantity: 1 },
          storeHeaders
        )

        const response = await api.post(
          `/store/carts/${cart.id}/promotions`,
          { promo_codes: ["BUYGETCART"] },
          storeHeaders
        )

        expect(response.status).toEqual(200)

        const items = response.data.cart.items
        const buyLine = items.find(
          (i: any) => i.metadata?.offer_id === buy.offer.id
        )
        const getLine = items.find(
          (i: any) => i.metadata?.offer_id === get.offer.id
        )

        expect(getLine.adjustments).toHaveLength(1)
        expect(getLine.adjustments[0].amount).toEqual(1000)
        expect(buyLine.adjustments ?? []).toHaveLength(0)
        expect(response.data.cart.discount_total).toEqual(1000)
      })
    })
  },
})
