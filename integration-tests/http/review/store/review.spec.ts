import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IOrderModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { ReviewWorkflowEvents } from "@mercurjs/core/workflows"
import { MercurModules, ReviewDTO, ReviewReference } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { waitForEvent } from "../../../helpers/wait-for-event"

jest.setTimeout(60000)

type SellerUser = Awaited<ReturnType<typeof createSellerUser>>

type ReviewService = {
  createReviews: (data: Record<string, unknown>) => Promise<ReviewDTO>
}

type SellerService = {
  updateSellers: (data: {
    id: string
    closed_from: Date
    closed_to: Date
  }) => Promise<unknown>
}

type ErrorResponse = { response: { status: number } }

type ReviewTarget = { reference: ReviewReference; id: string }

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Public reviews", () => {
      let appContainer: MedusaContainer
      let storeHeaders: ReturnType<typeof generateStoreHeaders>
      let seller: SellerUser["seller"]
      let sellerHeaders: SellerUser["headers"]

      const seedReview = async (
        target: ReviewTarget,
        overrides: Record<string, unknown> = {}
      ) => {
        const service = appContainer.resolve<ReviewService>(MercurModules.REVIEW)
        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)

        const review = await service.createReviews({
          reference: target.reference,
          rating: 5,
          customer_note: "Great",
          status: "published",
          ...overrides,
        })

        await link.create([
          target.reference === "product"
            ? {
                [Modules.PRODUCT]: { product_id: target.id },
                [MercurModules.REVIEW]: { review_id: review.id },
              }
            : {
                [MercurModules.SELLER]: { seller_id: target.id },
                [MercurModules.REVIEW]: { review_id: review.id },
              },
        ])

        return review
      }

      const createProduct = async (overrides: Record<string, unknown> = {}) => {
        const response = await api.post(
          `/vendor/products`,
          {
            title: "Test Product",
            status: "published",
            ...overrides,
          },
          sellerHeaders
        )

        return response.data.product
      }

      const get = (path: string) =>
        api.get(path, storeHeaders).catch((e: ErrorResponse) => e.response)

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const salesChannelModule =
          appContainer.resolve<ISalesChannelModuleService>(
            Modules.SALES_CHANNEL
          )
        const salesChannel = await salesChannelModule.createSalesChannels({
          name: "Test Store",
        })

        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
        await link.create({
          [Modules.API_KEY]: { publishable_key_id: publishableKey.id },
          [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
        })

        const result = await createSellerUser(appContainer, {
          email: "seller@test.com",
          name: "Test Seller",
        })
        seller = result.seller
        sellerHeaders = result.headers

        await api.post(
          `/admin/sellers/${seller.id}/approve`,
          {},
          adminHeaders
        )
      })

      describe("GET /store/products/:id/reviews", () => {
        it("lists published reviews without customer authentication", async () => {
          const product = await createProduct()
          await seedReview({ reference: "product", id: product.id })

          const response = await api.get(
            `/store/products/${product.id}/reviews`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(1)
          expect(response.data.reviews[0]).toEqual(
            expect.objectContaining({ rating: 5, customer_note: "Great" })
          )
        })

        it("excludes reviews that are not published", async () => {
          const product = await createProduct()
          const target: ReviewTarget = { reference: "product", id: product.id }
          await seedReview(target, { status: "pending" })
          await seedReview(target, { status: "rejected" })

          const response = await api.get(
            `/store/products/${product.id}/reviews`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(0)
        })

        it("rejects a status query param so unpublished reviews stay unreachable", async () => {
          const product = await createProduct()

          const response = await get(
            `/store/products/${product.id}/reviews?status=pending`
          )

          expect(response.status).toEqual(400)
        })

        it("excludes reviews left on another product", async () => {
          const product = await createProduct({ title: "Reviewed" })
          const other = await createProduct({ title: "Not reviewed" })
          await seedReview({ reference: "product", id: product.id })

          const response = await api.get(
            `/store/products/${other.id}/reviews`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(0)
        })

        it("filters by a single rating", async () => {
          const product = await createProduct()
          const target: ReviewTarget = { reference: "product", id: product.id }
          await seedReview(target, { rating: 1 })
          await seedReview(target, { rating: 3 })
          await seedReview(target, { rating: 5 })

          const response = await api.get(
            `/store/products/${product.id}/reviews?rating=5`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(1)
          expect(response.data.reviews[0].rating).toEqual(5)
        })

        it("filters by several ratings", async () => {
          const product = await createProduct()
          const target: ReviewTarget = { reference: "product", id: product.id }
          await seedReview(target, { rating: 1 })
          await seedReview(target, { rating: 3 })
          await seedReview(target, { rating: 5 })

          const response = await api.get(
            `/store/products/${product.id}/reviews?rating[]=1&rating[]=5`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(2)
          expect(
            response.data.reviews.map((r: ReviewDTO) => r.rating).sort()
          ).toEqual([1, 5])
        })

        it("exposes the reviewer's name but never their email, even when requested", async () => {
          const product = await createProduct()
          const review = await seedReview({ reference: "product", id: product.id })

          const { customer } = await createCustomerUser(appContainer)
          const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
          await link.create({
            [Modules.CUSTOMER]: { customer_id: customer.id },
            [MercurModules.REVIEW]: { review_id: review.id },
          })

          for (const query of ["", "?fields=*customer", "?fields=+customer.email"]) {
            const response = await api.get(
              `/store/products/${product.id}/reviews${query}`,
              storeHeaders
            )

            expect(response.status).toEqual(200)
            const reviewer = response.data.reviews[0].customer

            expect(reviewer).toEqual(
              expect.objectContaining({
                first_name: customer.first_name,
                last_name: customer.last_name,
              })
            )
            expect(reviewer).not.toHaveProperty("email")
          }
        })

        it("returns 404 for an unknown product", async () => {
          const response = await get(`/store/products/prod_does_not_exist/reviews`)

          expect(response.status).toEqual(404)
        })

        it("returns 404 for a product that is not published", async () => {
          const product = await createProduct({ status: "draft" })

          const response = await get(`/store/products/${product.id}/reviews`)

          expect(response.status).toEqual(404)
        })

        it("answers as the product detail route does under another publishable key", async () => {
          const product = await createProduct()
          await seedReview({ reference: "product", id: product.id })

          const salesChannelModule =
            appContainer.resolve<ISalesChannelModuleService>(
              Modules.SALES_CHANNEL
            )
          const otherChannel = await salesChannelModule.createSalesChannels({
            name: "Other Store",
          })
          const otherKey = await generatePublishableKey(appContainer)
          const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
          await link.create({
            [Modules.API_KEY]: { publishable_key_id: otherKey.id },
            [Modules.SALES_CHANNEL]: { sales_channel_id: otherChannel.id },
          })
          const otherHeaders = generateStoreHeaders({ publishableKey: otherKey })

          for (const headers of [storeHeaders, otherHeaders]) {
            const [detail, reviews] = await Promise.all(
              [`/store/products/${product.id}`, `/store/products/${product.id}/reviews`].map(
                (path) =>
                  api.get(path, headers).catch((e: ErrorResponse) => e.response)
              )
            )

            expect(reviews.status).toEqual(detail.status)
          }
        })
      })

      describe("GET /store/sellers/:id/reviews", () => {
        it("lists published seller reviews", async () => {
          await seedReview(
            { reference: "seller", id: seller.id },
            { customer_note: "Fast shipping" }
          )

          const response = await api.get(
            `/store/sellers/${seller.id}/reviews`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(1)
          expect(response.data.reviews[0]).toEqual(
            expect.objectContaining({ customer_note: "Fast shipping" })
          )
        })

        it("excludes product reviews", async () => {
          const product = await createProduct()
          await seedReview({ reference: "product", id: product.id })

          const response = await api.get(
            `/store/sellers/${seller.id}/reviews`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(0)
        })

        it("returns 404 for an unknown seller", async () => {
          const response = await get(`/store/sellers/sel_does_not_exist/reviews`)

          expect(response.status).toEqual(404)
        })

        it("returns 404 for a seller that is not open", async () => {
          const { seller: pending } = await createSellerUser(appContainer, {
            email: "pending@test.com",
            name: "Pending Seller",
          })
          await seedReview({ reference: "seller", id: pending.id })

          const response = await get(`/store/sellers/${pending.id}/reviews`)

          expect(response.status).toEqual(404)
        })

        it("returns 404 during a scheduled closure, as the seller itself does", async () => {
          await seedReview({ reference: "seller", id: seller.id })

          const sellerService = appContainer.resolve<SellerService>(
            MercurModules.SELLER
          )
          const day = 24 * 60 * 60 * 1000
          await sellerService.updateSellers({
            id: seller.id,
            closed_from: new Date(Date.now() - day),
            closed_to: new Date(Date.now() + day),
          })

          const [detail, reviews] = await Promise.all([
            get(`/store/sellers/${seller.id}`),
            get(`/store/sellers/${seller.id}/reviews`),
          ])

          expect(detail.status).toEqual(404)
          expect(reviews.status).toEqual(404)
        })
      })

      describe("POST /store/reviews", () => {
        it("emits review.created with the reviewed seller", async () => {
          const { customer, headers: customerAuth } =
            await createCustomerUser(appContainer)

          const orderService = appContainer.resolve<IOrderModuleService>(
            Modules.ORDER
          )
          const order = await orderService.createOrders({
            currency_code: "usd",
            email: customer.email,
            customer_id: customer.id,
            items: [{ title: "Test Item", quantity: 1, unit_price: 100 }],
          })

          const created = waitForEvent(appContainer, ReviewWorkflowEvents.CREATED)

          const response = await api.post(
            "/store/reviews",
            {
              order_id: order.id,
              reference: "seller",
              reference_id: seller.id,
              rating: 5,
            },
            { headers: { ...storeHeaders.headers, ...customerAuth.headers } }
          )

          expect(response.status).toEqual(201)
          expect(await created).toEqual({
            id: response.data.review.id,
            reference: "seller",
            reference_id: seller.id,
          })
        })
      })
    })
  },
})
