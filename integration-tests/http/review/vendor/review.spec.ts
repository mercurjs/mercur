import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

const SELLER_MODULE = "seller"

const seedReview = async (
  container: MedusaContainer,
  sellerId: string,
  overrides: Record<string, unknown> = {}
) => {
  const service = container.resolve(MercurModules.REVIEW)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const review = await service.createReviews({
    reference: "seller",
    rating: 4,
    customer_note: "Great store",
    status: "pending",
    ...overrides,
  })

  await link.create([
    {
      [SELLER_MODULE]: { seller_id: sellerId },
      [MercurModules.REVIEW]: { review_id: review.id },
    },
  ])

  return review
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Reviews", () => {
      let appContainer: MedusaContainer
      let sellerHeaders: any
      let sellerId: string

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const result = await createSellerUser(appContainer, {
          email: "seller@test.com",
          name: "Test Seller",
        })
        sellerHeaders = result.headers
        sellerId = (result.seller as any).id
      })

      describe("GET /vendor/reviews", () => {
        it("lists only the authenticated seller's reviews", async () => {
          await seedReview(appContainer, sellerId)

          const other = await createSellerUser(appContainer, {
            email: "other@test.com",
            name: "Other Seller",
          })
          await seedReview(appContainer, (other.seller as any).id, {
            customer_note: "Not mine",
          })

          const response = await api.get("/vendor/reviews", sellerHeaders)

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(1)
          expect(response.data.reviews[0].customer_note).toEqual("Great store")
          expect(response.data.reviews[0].status).toEqual("pending")
        })
      })

      describe("GET /vendor/reviews/:id", () => {
        it("404s for a review that belongs to another seller", async () => {
          const other = await createSellerUser(appContainer, {
            email: "other@test.com",
            name: "Other Seller",
          })
          const foreign = await seedReview(
            appContainer,
            (other.seller as any).id
          )

          const response = await api
            .get(`/vendor/reviews/${foreign.id}`, sellerHeaders)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /vendor/reviews/:id (respond)", () => {
        it("adds a response once and rejects a second response", async () => {
          const review = await seedReview(appContainer, sellerId)

          const first = await api.post(
            `/vendor/reviews/${review.id}`,
            { seller_note: "Thank you for your feedback." },
            sellerHeaders
          )
          expect(first.status).toEqual(200)
          expect(first.data.review.seller_note).toEqual(
            "Thank you for your feedback."
          )

          const second = await api
            .post(
              `/vendor/reviews/${review.id}`,
              { seller_note: "Another response" },
              sellerHeaders
            )
            .catch((e) => e.response)

          expect(second.status).toEqual(400)
        })

        it("rejects an empty response", async () => {
          const review = await seedReview(appContainer, sellerId)

          const response = await api
            .post(
              `/vendor/reviews/${review.id}`,
              { seller_note: "" },
              sellerHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("does not allow changing status or rating", async () => {
          const review = await seedReview(appContainer, sellerId)

          await api.post(
            `/vendor/reviews/${review.id}`,
            { seller_note: "Thanks", status: "published", rating: 1 },
            sellerHeaders
          )

          const service = appContainer.resolve(MercurModules.REVIEW)
          const [persisted] = await service.listReviews({ id: review.id })

          expect(persisted.status).toEqual("pending")
          expect(persisted.rating).toEqual(4)
        })
      })
    })
  },
})
