import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
  completeSplitOrderCheckout,
  seedSellerOfferWithShipping,
} from "../../../helpers/split-order-checkout"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Reviews", () => {
      let appContainer: MedusaContainer
      let storeHeaders: { headers: Record<string, string> }
      let sellerA: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>
      let sellerB: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>
      let order: { id: string; items: { product_id: string }[] }

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const customer = await createCustomerUser(appContainer, {
          email: "reviewer@test.com",
          first_name: "Review",
          last_name: "Buyer",
        })
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = {
          headers: {
            ...generateStoreHeaders({ publishableKey }).headers,
            ...customer.headers.headers,
          },
        }

        const salesChannel = await appContainer
          .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
          .createSalesChannels({ name: "Review Channel" })
        const region = await appContainer
          .resolve<IRegionModuleService>(Modules.REGION)
          .createRegions({
            name: "Review Region",
            currency_code: "usd",
            countries: ["us"],
          })
        await appContainer.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.REGION]: { region_id: region.id },
          [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
        })

        sellerA = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId: salesChannel.id,
          email: "review-a@test.com",
          name: "ReviewA",
          stocked: 10,
          offerPrice: 1000,
        })
        sellerB = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId: salesChannel.id,
          email: "review-b@test.com",
          name: "ReviewB",
          stocked: 10,
          offerPrice: 2000,
        })

        const placed = await completeSplitOrderCheckout({
          container: appContainer,
          api,
          storeHeaders,
          regionId: region.id,
          salesChannelId: salesChannel.id,
          email: customer.customer.email!,
          offerId: sellerA.offer.id,
        })
        const { data } = await appContainer
          .resolve(ContainerRegistrationKeys.QUERY)
          .graph({
            entity: "order",
            filters: { id: placed.id },
            fields: ["id", "items.product_id"],
          })
        order = data[0] as typeof order
      })

      describe("POST /store/reviews", () => {
        it("creates a review for the order's seller", async () => {
          const response = await api.post(
            "/store/reviews",
            {
              order_id: order.id,
              reference: "seller",
              reference_id: sellerA.sellerId,
              rating: 5,
              customer_note: "Fast shipping",
            },
            storeHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.review.rating).toEqual(5)
          expect(response.data.review.reference).toEqual("seller")
        })

        it("creates a review for a product in the order", async () => {
          const response = await api.post(
            "/store/reviews",
            {
              order_id: order.id,
              reference: "product",
              reference_id: order.items[0].product_id,
              rating: 4,
            },
            storeHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.review.reference).toEqual("product")
        })

        it("rejects a seller that did not fulfil the order", async () => {
          const response = await api
            .post(
              "/store/reviews",
              {
                order_id: order.id,
                reference: "seller",
                reference_id: sellerB.sellerId,
                rating: 1,
              },
              storeHeaders
            )
            .catch((e: { response: unknown }) => e.response)

          expect(response.status).toEqual(404)
        })

        it("rejects a product that is not in the order", async () => {
          const { data } = await appContainer
            .resolve(ContainerRegistrationKeys.QUERY)
            .graph({
              entity: "offer",
              filters: { id: sellerB.offer.id },
              fields: ["product_id"],
            })
          const foreignProductId = (data[0] as { product_id: string }).product_id

          const response = await api
            .post(
              "/store/reviews",
              {
                order_id: order.id,
                reference: "product",
                reference_id: foreignProductId,
                rating: 1,
              },
              storeHeaders
            )
            .catch((e: { response: unknown }) => e.response)

          expect(response.status).toEqual(404)
        })

        it("rejects a seller id passed as a product reference", async () => {
          const response = await api
            .post(
              "/store/reviews",
              {
                order_id: order.id,
                reference: "product",
                reference_id: sellerA.sellerId,
                rating: 1,
              },
              storeHeaders
            )
            .catch((e: { response: unknown }) => e.response)

          expect(response.status).toEqual(404)
        })

        it("rejects a duplicate review for the same reference", async () => {
          const payload = {
            order_id: order.id,
            reference: "seller",
            reference_id: sellerA.sellerId,
            rating: 3,
          }
          await api.post("/store/reviews", payload, storeHeaders)

          const response = await api
            .post("/store/reviews", payload, storeHeaders)
            .catch((e: { response: unknown }) => e.response)

          expect(response.status).toEqual(400)
        })
      })
    })
  },
})
