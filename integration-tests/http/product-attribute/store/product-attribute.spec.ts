import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

import { createProductAttributesWorkflow } from "@mercurjs/core/workflows"

import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    let appContainer: MedusaContainer
    let storeHeaders: { headers: Record<string, string> }
    let catA: { id: string }
    let linkedAId: string
    let linkedBId: string
    let globalId: string

    const createAttr = async (opts: {
      name: string
      category_ids?: string[]
    }) => {
      const { result } = await createProductAttributesWorkflow(
        appContainer
      ).run({
        input: {
          attributes: [
            {
              name: opts.name,
              type: "single_select",
              values: [{ name: `${opts.name} value`, rank: 0 }],
              category_ids: opts.category_ids,
            },
          ],
        },
      })
      return result[0].id
    }

    beforeAll(async () => {
      appContainer = getContainer()

      const productModule = appContainer.resolve(Modules.PRODUCT)
      const [createdA, createdB] = await productModule.createProductCategories([
        { name: "Store Attr Cat A", is_active: true },
        { name: "Store Attr Cat B", is_active: true },
      ])
      catA = createdA

      linkedAId = await createAttr({
        name: "Store Linked A",
        category_ids: [createdA.id],
      })
      linkedBId = await createAttr({
        name: "Store Linked B",
        category_ids: [createdB.id],
      })
      globalId = await createAttr({ name: "Store Global" })

      const salesChannelModule =
        appContainer.resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
      await salesChannelModule.createSalesChannels({ name: "Store Attr Channel" })
    })

    beforeEach(async () => {
      const publishableKey = await generatePublishableKey(appContainer)
      storeHeaders = generateStoreHeaders({ publishableKey })
    })

    // A single category-scoped request exercises the whole filter: the
    // category-linked attribute AND the global (uncategorized) attribute are
    // returned, while an attribute linked only to another category is excluded.
    it("category_id returns linked + global attributes, excludes other-category attributes", async () => {
      const res = await api.get(
        `/store/product-attributes?category_id=${catA.id}`,
        storeHeaders
      )

      expect(res.status).toBe(200)
      const ids = res.data.product_attributes.map((a: { id: string }) => a.id)
      expect(ids).toContain(linkedAId)
      expect(ids).toContain(globalId)
      expect(ids).not.toContain(linkedBId)
    })
  },
})
