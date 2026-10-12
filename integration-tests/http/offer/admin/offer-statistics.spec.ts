import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { IOfferModuleService, MercurModules } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(90000)

type OfferServiceUnderTest = IOfferModuleService & {
  softDeleteOffers(ids: string[]): Promise<unknown>
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("GET /admin/offers/statistics", () => {
      let container: MedusaContainer
      let offerService: OfferServiceUnderTest
      let seller1: any
      let seller1Headers: any
      let seller2: any
      let seller2Headers: any
      let offerIds: string[]

      const createOffer = async (
        headers: any,
        sku: string,
        variantId: string,
        shippingProfileId: string
      ) => {
        const response = await api.post(
          "/vendor/offers",
          {
            sku,
            variant_id: variantId,
            shipping_profile_id: shippingProfileId,
            inventory_items: [{}],
            prices: [{ amount: 1000, currency_code: "usd" }],
          },
          headers
        )
        expect(response.status).toEqual(201)
        return response.data.offer.id as string
      }

      const getStatistics = async (query = "") => {
        const response = await api.get(
          `/admin/offers/statistics${query}`,
          adminHeaders
        )
        expect(response.status).toEqual(200)
        return response.data.statistics
      }

      beforeAll(() => {
        container = getContainer()
        offerService = container.resolve(MercurModules.OFFER)
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)

        const r1 = await createSellerUser(container, {
          email: "stats-seller1@test.com",
          name: "Stats Seller One",
        })
        seller1 = r1.seller
        seller1Headers = r1.headers

        const r2 = await createSellerUser(container, {
          email: "stats-seller2@test.com",
          name: "Stats Seller Two",
        })
        seller2 = r2.seller
        seller2Headers = r2.headers

        const productA = await createVendorProduct(api, seller1Headers, {
          title: `Stats Product A ${Date.now()}`,
          variants: [{ title: "Default" }],
        })
        const productB = await createVendorProduct(api, seller1Headers, {
          title: `Stats Product B ${Date.now()}`,
          variants: [{ title: "Default" }],
        })

        const profile1 = await createShippingProfile(container, {
          name: "Stats Profile One",
        })
        const profile2 = await createShippingProfile(container, {
          name: "Stats Profile Two",
        })

        offerIds = [
          await createOffer(
            seller1Headers,
            "STATS-S1-A",
            productA.variants[0].id,
            profile1.id
          ),
          await createOffer(
            seller1Headers,
            "STATS-S1-B",
            productB.variants[0].id,
            profile1.id
          ),
          await createOffer(
            seller2Headers,
            "STATS-S2-A",
            productA.variants[0].id,
            profile2.id
          ),
        ]
      })

      it("returns the offer envelope with distinct sellers and products", async () => {
        const statistics = await getStatistics()

        expect(statistics).toEqual({ offers: 3, sellers: 2, products: 2 })
      })

      it("excludes offers created after `at`", async () => {
        await dbConnection.raw(
          `UPDATE offer SET created_at = '2030-01-01T00:00:00Z' WHERE id = ?`,
          [offerIds[2]]
        )

        const statistics = await getStatistics(
          `?at=${encodeURIComponent("2029-12-31T00:00:00Z")}`
        )

        expect(statistics).toEqual({ offers: 2, sellers: 1, products: 2 })
      })

      it("counts an offer deleted after `at` and skips one deleted before", async () => {
        await offerService.softDeleteOffers([offerIds[0], offerIds[1]])
        await dbConnection.raw(
          `UPDATE offer SET created_at = '2020-01-01T00:00:00Z' WHERE id IN (?, ?, ?)`,
          offerIds
        )
        await dbConnection.raw(
          `UPDATE offer SET deleted_at = '2025-01-01T00:00:00Z' WHERE id = ?`,
          [offerIds[0]]
        )
        await dbConnection.raw(
          `UPDATE offer SET deleted_at = '2023-01-01T00:00:00Z' WHERE id = ?`,
          [offerIds[1]]
        )

        const now = await getStatistics()
        expect(now).toEqual({ offers: 1, sellers: 1, products: 1 })

        const between = await getStatistics(
          `?at=${encodeURIComponent("2024-01-01T00:00:00Z")}`
        )
        expect(between).toEqual({ offers: 2, sellers: 2, products: 1 })
      })

      it("narrows the count with the seller_id filter", async () => {
        expect(await getStatistics(`?seller_id=${seller1.id}`)).toEqual({
          offers: 2,
          sellers: 1,
          products: 2,
        })

        expect(
          await getStatistics(
            `?seller_id[]=${seller1.id}&seller_id[]=${seller2.id}`
          )
        ).toEqual({ offers: 3, sellers: 2, products: 2 })
      })

      it("rejects an unparseable `at`", async () => {
        const response = await api
          .get("/admin/offers/statistics?at=not-a-date", adminHeaders)
          .catch((error: { response: unknown }) => error.response)

        expect(response.status).toEqual(400)
      })
    })
  },
})
