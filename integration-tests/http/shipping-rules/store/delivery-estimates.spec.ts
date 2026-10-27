import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { computeExpectedDelivery } from "@mercurjs/types"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import {
  completeSplitOrderCheckout,
  seedSellerOfferWithShipping,
} from "../../../helpers/split-order-checkout"
import { createScopedAdminHeaders } from "../../../helpers/shipping-rules"

jest.setTimeout(180000)

type StoreHeaders = { headers: Record<string, string> }
type StoreShippingOption = {
  id: string
  estimated_delivery: {
    shipping_deadline: string
    earliest: string | null
    latest: string | null
  } | null
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Store - shipping delivery estimates", () => {
      let appContainer: MedusaContainer
      let storeHeaders: StoreHeaders
      let customerEmail: string
      let regionId: string
      let salesChannelId: string
      let offerId: string
      let sellerId: string

      beforeEach(async () => {
        appContainer = getContainer()
        const customer = await createCustomerUser(appContainer, {
          email: "delivery-buyer@test.com",
          first_name: "Delivery",
          last_name: "Buyer",
        })
        customerEmail = customer.customer.email!
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = {
          headers: {
            ...generateStoreHeaders({ publishableKey }).headers,
            ...customer.headers.headers,
          },
        }

        salesChannelId = (
          await appContainer
            .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
            .createSalesChannels({ name: "Delivery Channel" })
        ).id

        regionId = (
          await appContainer
            .resolve<IRegionModuleService>(Modules.REGION)
            .createRegions({
              name: "Delivery Region",
              currency_code: "usd",
              countries: ["us"],
            })
        ).id

        await appContainer.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.REGION]: { region_id: regionId },
          [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
        })

        const seed = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId,
          email: "delivery-seller@test.com",
          name: "DeliverySeller",
          stocked: 10,
          offerPrice: 2500,
          transitMinDays: 1,
          transitMaxDays: 3,
          leadtimeToShip: 2,
        })
        offerId = seed.offer.id
        sellerId = seed.sellerId
      })

      const cartWithOffer = async () => {
        const cart = (
          await api.post(
            "/store/carts",
            {
              region_id: regionId,
              sales_channel_id: salesChannelId,
              currency_code: "usd",
            },
            storeHeaders
          )
        ).data.cart
        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: offerId, quantity: 1 },
          storeHeaders
        )
        await api.post(
          `/store/carts/${cart.id}`,
          {
            email: customerEmail,
            shipping_address: {
              first_name: "Delivery",
              last_name: "Buyer",
              address_1: "1 Main St",
              city: "New York",
              country_code: "us",
              postal_code: "10001",
            },
          },
          storeHeaders
        )
        return cart.id as string
      }

      const listOptions = async (cartId: string) => {
        const { data } = await api.get(
          `/store/shipping-options?cart_id=${cartId}`,
          storeHeaders
        )
        return Object.values(
          data.shipping_options as Record<string, StoreShippingOption[]>
        ).flat()
      }

      it("returns a delivery window per shipping option from lead time and transit", async () => {
        const options = await listOptions(await cartWithOffer())

        expect(options).toHaveLength(1)
        expect(options[0].estimated_delivery).toEqual(
          computeExpectedDelivery({
            start: new Date(),
            leadtimeDays: 2,
            transitMinDays: 1,
            transitMaxDays: 3,
          })
        )
      })

      it("hides options whose rule the marketplace marked not supported", async () => {
        const adminHeaders = await createScopedAdminHeaders(appContainer)
        const { data } = await api.get("/admin/shipping-rules", adminHeaders)
        await api.post(
          `/admin/shipping-rules/${data.shipping_rules[0].id}`,
          { requirement: "not_supported" },
          adminHeaders
        )

        expect(await listOptions(await cartWithOffer())).toHaveLength(0)
      })

      it("stores the expected delivery on the seller's order", async () => {
        const order = await completeSplitOrderCheckout({
          container: appContainer,
          api,
          storeHeaders,
          regionId,
          salesChannelId,
          offerId,
          email: customerEmail,
        })

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const {
          data: [stored],
        } = await query.graph({
          entity: "order",
          fields: ["id", "metadata", "shipping_methods.metadata"],
          filters: { id: order.id },
        })

        const expected = computeExpectedDelivery({
          start: new Date(),
          leadtimeDays: 2,
          transitMinDays: 1,
          transitMaxDays: 3,
        })
        expect(stored.metadata?.expected_delivery).toEqual(expected)
        expect(
          (stored.shipping_methods ?? [])[0]?.metadata?.expected_delivery
        ).toEqual(expected)
        expect(sellerId).toBeDefined()
      })
    })
  },
})
