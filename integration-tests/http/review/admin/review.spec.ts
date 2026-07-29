import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

const seedSellerReview = async (
  container: MedusaContainer,
  sellerId: string,
  overrides: Record<string, unknown> = {}
) => {
  const reviewService = container.resolve(MercurModules.REVIEW)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const review = await reviewService.createReviews({
    reference: "seller",
    rating: 3,
    customer_note: "It was okay",
    ...overrides,
  })

  await link.create([
    {
      [MercurModules.SELLER]: { seller_id: sellerId },
      [MercurModules.REVIEW]: { review_id: review.id },
    },
  ])

  return review
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Reviews", () => {
      let appContainer: MedusaContainer
      let seller: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const result = await createSellerUser(appContainer)
        seller = result.seller
      })

      describe("GET /admin/reviews", () => {
        it("lists reviews with status defaulting to pending", async () => {
          await seedSellerReview(appContainer, seller.id)

          const response = await api.get("/admin/reviews", adminHeaders)

          expect(response.status).toEqual(200)
          expect(Array.isArray(response.data.reviews)).toBe(true)
          expect(response.data.count).toBeGreaterThanOrEqual(1)
          expect(response.data.reviews[0].status).toEqual("pending")
        })

        it("filters reviews by rating", async () => {
          await seedSellerReview(appContainer, seller.id, { rating: 1 })
          await seedSellerReview(appContainer, seller.id, { rating: 5 })

          const response = await api.get(
            "/admin/reviews?rating=5",
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.reviews.every((r: any) => r.rating === 5)).toBe(
            true
          )
        })

        it("filters reviews by status", async () => {
          await seedSellerReview(appContainer, seller.id, {
            status: "published",
          })
          await seedSellerReview(appContainer, seller.id, { status: "pending" })

          const response = await api.get(
            "/admin/reviews?status=published",
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.reviews.every((r: any) => r.status === "published")
          ).toBe(true)
        })
      })

      describe("POST /admin/reviews/:id", () => {
        it("updates the status and rating", async () => {
          const review = await seedSellerReview(appContainer, seller.id)

          const response = await api.post(
            `/admin/reviews/${review.id}`,
            { status: "published", rating: 4 },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.review.status).toEqual("published")
          expect(response.data.review.rating).toEqual(4)
        })

        it("rejects a rating outside 1-5", async () => {
          const review = await seedSellerReview(appContainer, seller.id)

          const error = await api
            .post(
              `/admin/reviews/${review.id}`,
              { rating: 6 },
              adminHeaders
            )
            .catch((e) => e)

          expect(error.response.status).toEqual(400)
        })
      })

      describe("POST /admin/reviews/:id/respond", () => {
        it("adds a response once and rejects a second response", async () => {
          const review = await seedSellerReview(appContainer, seller.id)

          const first = await api.post(
            `/admin/reviews/${review.id}/respond`,
            { seller_note: "Thanks for the feedback" },
            adminHeaders
          )

          expect(first.status).toEqual(200)
          expect(first.data.review.seller_note).toEqual(
            "Thanks for the feedback"
          )

          const second = await api
            .post(
              `/admin/reviews/${review.id}/respond`,
              { seller_note: "Another response" },
              adminHeaders
            )
            .catch((e) => e)

          expect(second.response.status).toBeGreaterThanOrEqual(400)
        })
      })

      describe("DELETE /admin/reviews/:id", () => {
        it("deletes a review", async () => {
          const review = await seedSellerReview(appContainer, seller.id)

          const response = await api.delete(
            `/admin/reviews/${review.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.deleted).toBe(true)

          const list = await api.get("/admin/reviews", adminHeaders)
          expect(
            list.data.reviews.find((r: any) => r.id === review.id)
          ).toBeUndefined()
        })
      })
    })
  },
})
