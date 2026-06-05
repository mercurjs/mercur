/**
 * Integration tests for admin Meilisearch endpoints:
 *   GET  /admin/meilisearch      — index status
 *   POST /admin/meilisearch/sync — trigger full re-index
 *
 * Prerequisites (handled by test:integration:meilisearch script):
 *   - MEILISEARCH_HOST env var must be set
 *   - The meilisearch npm package is mocked below — no real Meilisearch instance needed
 */

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { IndexType } from "../../../../packages/registry/src/meilisearch/modules/meilisearch/types"
import { mockGetStats } from "../../../helpers/mock-meilisearch"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Meilisearch", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        jest.clearAllMocks()
        mockGetStats.mockResolvedValue({ numberOfDocuments: 42 })
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      describe("GET /admin/meilisearch", () => {
        it("returns 200 with host, index, documentCount, and isHealthy", async () => {
          const response = await api.get("/admin/meilisearch", adminHeaders)

          expect(response.status).toBe(200)
          expect(response.data).toMatchObject({
            host: expect.any(String),
            index: IndexType.PRODUCT,
            documentCount: 42,
            isHealthy: true,
          })
        })

        it("returns isHealthy:false when meilisearch is unreachable", async () => {
          mockGetStats.mockRejectedValueOnce(new Error("Connection refused"))

          const response = await api.get("/admin/meilisearch", adminHeaders)

          expect(response.status).toBe(200)
          expect(response.data.isHealthy).toBe(false)
          expect(response.data.documentCount).toBe(0)
        })

        it("requires admin authentication — returns 401 without token", async () => {
          const response = await api.get("/admin/meilisearch", {
            headers: {},
          })

          expect(response.status).toBe(401)
        })
      })

      describe("POST /admin/meilisearch", () => {
        it("returns 200 with sync in progress message", async () => {
          const response = await api.post(
            "/admin/meilisearch",
            {},
            adminHeaders
          )

          expect(response.status).toBe(200)
          expect(response.data).toMatchObject({ message: "Sync in progress" })
        })

        it("requires admin authentication — returns 401 without token", async () => {
          const response = await api.post("/admin/meilisearch", {}, {
            headers: {},
          })

          expect(response.status).toBe(401)
        })
      })
    })
  },
})
