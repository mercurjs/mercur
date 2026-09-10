import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Public reviews", () => {
      let appContainer: MedusaContainer
      let storeHeaders: ReturnType<typeof generateStoreHeaders>
      let seller: any
      let sellerHeaders: any

      const seedReview = async (
        target: { module: string; key: string; id: string },
        overrides: Record<string, unknown> = {}
      ) => {
        const service = appContainer.resolve(MercurModules.REVIEW)
        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)

        const review = await service.createReviews({
          reference: "product",
          rating: 5,
          customer_note: "Great",
          status: "published",
          ...overrides,
        })

        await link.create([
          {
            [target.module]: { [target.key]: target.id },
            [MercurModules.REVIEW]: { review_id: review.id },
          },
        ])

        return review
      }

      const createProduct = async (overrides: Record<string, any> = {}) => {
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
          await seedReview({
            module: Modules.PRODUCT,
            key: "product_id",
            id: product.id,
          })

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
          await seedReview(
            { module: Modules.PRODUCT, key: "product_id", id: product.id },
            { status: "pending", customer_note: "Pending one" }
          )
          await seedReview(
            { module: Modules.PRODUCT, key: "product_id", id: product.id },
            { status: "rejected", customer_note: "Rejected one" }
          )

          const response = await api.get(
            `/store/products/${product.id}/reviews`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(0)
        })

        it("rejects a status query param so unpublished reviews stay unreachable", async () => {
          const product = await createProduct()

          const response = await api
            .get(
              `/store/products/${product.id}/reviews?status=pending`,
              storeHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("excludes reviews left on another product", async () => {
          const product = await createProduct({ title: "Reviewed" })
          const other = await createProduct({ title: "Not reviewed" })

          await seedReview({
            module: Modules.PRODUCT,
            key: "product_id",
            id: product.id,
          })

          const response = await api.get(
            `/store/products/${other.id}/reviews`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(0)
        })

        it("returns 404 for an unknown product", async () => {
          const response = await api
            .get(`/store/products/prod_does_not_exist/reviews`, storeHeaders)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("GET /store/sellers/:id/reviews", () => {
        it("lists published seller reviews", async () => {
          await seedReview(
            { module: MercurModules.SELLER, key: "seller_id", id: seller.id },
            { reference: "seller", customer_note: "Fast shipping" }
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
          await seedReview({
            module: Modules.PRODUCT,
            key: "product_id",
            id: product.id,
          })

          const response = await api.get(
            `/store/sellers/${seller.id}/reviews`,
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(0)
        })

        it("returns 404 for an unknown seller", async () => {
          const response = await api
            .get(`/store/sellers/sel_does_not_exist/reviews`, storeHeaders)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })
    })
  },
})
