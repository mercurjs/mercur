import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

const waitFor = async (predicate: () => boolean, timeoutMs = 5000) => {
  const started = Date.now()
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - product publishing and SKU filter", () => {
      let appContainer: MedusaContainer
      let published: { id: string }[]

      beforeAll(() => {
        appContainer = getContainer()
        // The container outlives the tests, so one subscription serves them all.
        const eventBus = appContainer.resolve(Modules.EVENT_BUS)
        eventBus.subscribe("product.published", async (event: { data: unknown }) => {
          const data = Array.isArray(event.data) ? event.data : [event.data]
          published.push(...(data as { id: string }[]))
        })
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        published = []
      })

      const createProduct = async (status: string, sku: string) => {
        const response = await api.post(
          `/admin/products`,
          {
            title: `Product ${sku}`,
            status,
            variants: [{ title: "Default", sku }],
          },
          adminHeaders
        )
        expect(response.status).toEqual(200)

        return response.data.product
      }

      it("emits product.published for a product created as published", async () => {
        const product = await createProduct("published", `PUB-${Date.now()}`)

        await waitFor(() => published.some((p) => p.id === product.id))

        expect(published).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: product.id })])
        )
      })

      it("emits product.published once when a draft is published, not on later edits", async () => {
        const product = await createProduct("draft", `DRAFT-${Date.now()}`)
        expect(published).toEqual([])

        const publish = await api.post(
          `/admin/products/${product.id}`,
          { status: "published" },
          adminHeaders
        )
        expect(publish.status).toEqual(200)
        await waitFor(() => published.some((p) => p.id === product.id))
        expect(published.filter((p) => p.id === product.id)).toHaveLength(1)

        const rename = await api.post(
          `/admin/products/${product.id}`,
          { title: "Renamed", status: "published" },
          adminHeaders
        )
        expect(rename.status).toEqual(200)
        await new Promise((resolve) => setTimeout(resolve, 300))
        expect(published.filter((p) => p.id === product.id)).toHaveLength(1)
      })

      it("filters the product list by variant SKU", async () => {
        const sku = `SKU-${Date.now()}`
        const product = await createProduct("published", sku)
        await createProduct("published", `OTHER-${Date.now()}`)

        const response = await api.get(`/admin/products?sku=${sku}`, adminHeaders)

        expect(response.status).toEqual(200)
        expect(response.data.products).toHaveLength(1)
        expect(response.data.products[0].id).toEqual(product.id)
      })
    })
  },
})
