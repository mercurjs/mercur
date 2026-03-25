/**
 * Integration tests for POST /store/meilisearch/products/search
 *
 * Prerequisites (handled by test:integration:meilisearch script):
 *   - MEILISEARCH_HOST env var must be set
 *   - MEILISEARCH_API_KEY env var must be set
 *   - The meilisearch npm package is mocked below — no real Meilisearch instance needed
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

// ─── Mock meilisearch client so no real network calls are made ────────────────

const mockSearchFn = jest.fn()
const mockIndexFn = jest.fn().mockReturnValue({
  search: mockSearchFn,
  addDocuments: jest.fn().mockResolvedValue({}),
  deleteDocuments: jest.fn().mockResolvedValue({}),
  getStats: jest.fn().mockResolvedValue({ numberOfDocuments: 0 }),
  updateSettings: jest.fn().mockResolvedValue({}),
})

jest.mock("meilisearch", () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    index: mockIndexFn,
    config: { host: "http://localhost:7700" },
  })),
}))

// ─── Test suite ───────────────────────────────────────────────────────────────

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Meilisearch product search", () => {
      let appContainer: MedusaContainer
      let storeHeaders: ReturnType<typeof generateStoreHeaders>
      let sellerActive: any
      let sellerSuspended: any
      let productActiveId: string
      let productSuspendedId: string

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        jest.clearAllMocks()

        await createAdminUser(dbConnection, adminHeaders, appContainer)

        // Create two sellers
        const resultActive = await createSellerUser(appContainer, {
          email: "active-seller@test.com",
          name: "Active Store",
        })
        sellerActive = resultActive.seller

        const resultSuspended = await createSellerUser(appContainer, {
          email: "suspended-seller@test.com",
          name: "Suspended Store",
        })
        sellerSuspended = resultSuspended.seller

        // Approve both sellers
        await api.post(`/admin/sellers/${sellerActive.id}/approve`, {}, adminHeaders)
        await api.post(`/admin/sellers/${sellerSuspended.id}/approve`, {}, adminHeaders)

        // Create a product for each seller
        const productActiveRes = await api.post(
          `/vendor/products`,
          {
            title: "Active Seller Shoes",
            status: "published",
            options: [{ title: "Size", values: ["M"] }],
            variants: [
              {
                title: "M",
                options: { Size: "M" },
                prices: [{ currency_code: "usd", amount: 50 }],
              },
            ],
          },
          resultActive.headers
        )
        productActiveId = productActiveRes.data.product.id

        const productSuspendedRes = await api.post(
          `/vendor/products`,
          {
            title: "Suspended Seller Hat",
            status: "published",
            options: [{ title: "Size", values: ["M"] }],
            variants: [
              {
                title: "M",
                options: { Size: "M" },
                prices: [{ currency_code: "usd", amount: 30 }],
              },
            ],
          },
          resultSuspended.headers
        )
        productSuspendedId = productSuspendedRes.data.product.id

        // Suspend the second seller
        await api.post(`/admin/sellers/${sellerSuspended.id}/suspend`, {}, adminHeaders)

        // Generate store headers
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })
      })

      describe("POST /store/meilisearch/products/search", () => {
        it("returns 200 with product list and metadata when meilisearch returns hits", async () => {
          // Meilisearch returns the active seller product ID
          mockSearchFn.mockResolvedValueOnce({
            hits: [{ id: productActiveId }],
            totalHits: 1,
            page: 1,
            totalPages: 1,
            hitsPerPage: 12,
            processingTimeMs: 5,
            query: "shoes",
          })

          const response = await api.post(
            `/store/meilisearch/products/search`,
            { query: "shoes" },
            storeHeaders
          )

          expect(response.status).toBe(200)
          expect(response.data.products).toHaveLength(1)
          expect(response.data.products[0].id).toBe(productActiveId)
          expect(response.data).toMatchObject({
            totalHits: 1,
            page: 1,
            query: expect.any(String),
            processingTimeMs: expect.any(Number),
          })
        })

        it("returns empty products array when meilisearch returns no hits", async () => {
          mockSearchFn.mockResolvedValueOnce({
            hits: [],
            totalHits: 0,
            page: 1,
            totalPages: 0,
            hitsPerPage: 12,
            processingTimeMs: 3,
            query: "xyz_notfound",
          })

          const response = await api.post(
            `/store/meilisearch/products/search`,
            { query: "xyz_notfound" },
            storeHeaders
          )

          expect(response.status).toBe(200)
          expect(response.data.products).toEqual([])
          expect(response.data.totalHits).toBe(0)
        })

        it("passes seller.status = 'active' filter to meilisearch (FR-003)", async () => {
          mockSearchFn.mockResolvedValueOnce({
            hits: [],
            totalHits: 0,
            page: 1,
            totalPages: 0,
            hitsPerPage: 12,
            processingTimeMs: 2,
            query: "",
          })

          await api.post(
            `/store/meilisearch/products/search`,
            { query: "" },
            storeHeaders
          )

          const searchOptions = mockSearchFn.mock.calls[0][1]
          expect(searchOptions.filter).toContain('seller.status = "active"')
        })

        it("includes category filter when provided", async () => {
          mockSearchFn.mockResolvedValueOnce({
            hits: [],
            totalHits: 0,
            page: 1,
            totalPages: 0,
            hitsPerPage: 12,
            processingTimeMs: 2,
            query: "",
          })

          await api.post(
            `/store/meilisearch/products/search`,
            { filters: { categories: ["cat_1"] } },
            storeHeaders
          )

          const filter = mockSearchFn.mock.calls[0][1].filter
          expect(filter).toContain("categories.id IN")
          expect(filter).toContain("cat_1")
        })

        it("includes price range filters when provided", async () => {
          mockSearchFn.mockResolvedValueOnce({
            hits: [],
            totalHits: 0,
            page: 1,
            totalPages: 0,
            hitsPerPage: 12,
            processingTimeMs: 2,
            query: "",
          })

          await api.post(
            `/store/meilisearch/products/search`,
            { filters: { price_min: 10, price_max: 100 } },
            storeHeaders
          )

          const filter = mockSearchFn.mock.calls[0][1].filter
          expect(filter).toContain("variants.prices.amount >= 10")
          expect(filter).toContain("variants.prices.amount <= 100")
        })

        it("returns 400 when request body is invalid", async () => {
          const response = await api.post(
            `/store/meilisearch/products/search`,
            { hitsPerPage: 9999 }, // exceeds max of 100
            storeHeaders
          )

          expect(response.status).toBe(400)
        })

        it("requires x-publishable-api-key header — returns 401 without it", async () => {
          mockSearchFn.mockResolvedValueOnce({
            hits: [],
            totalHits: 0,
            page: 1,
            totalPages: 0,
            hitsPerPage: 12,
            processingTimeMs: 2,
            query: "",
          })

          const response = await api.post(
            `/store/meilisearch/products/search`,
            { query: "test" },
            { headers: {} }
          )

          expect([400, 401]).toContain(response.status)
        })

        it("hydrates products from Medusa DB in meilisearch relevance order", async () => {
          // Simulate meilisearch returning prod_2 first (higher relevance)
          mockSearchFn.mockResolvedValueOnce({
            hits: [{ id: productActiveId }, { id: "some-other-id" }],
            totalHits: 2,
            page: 1,
            totalPages: 1,
            hitsPerPage: 12,
            processingTimeMs: 5,
            query: "shoe",
          })

          const response = await api.post(
            `/store/meilisearch/products/search`,
            { query: "shoe" },
            storeHeaders
          )

          // Only existing products are returned (the mock returns a non-existent ID too)
          expect(response.status).toBe(200)
          const ids = response.data.products.map((p: any) => p.id)
          // productActiveId should appear first (matches meilisearch hit order)
          expect(ids[0]).toBe(productActiveId)
        })
      })
    })
  },
})
