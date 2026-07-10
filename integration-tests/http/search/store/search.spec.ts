import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"

import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

const REGION = "reg_test"

const seedProducts = [
  {
    product_id: "prod_shoe",
    title: "Running Shoe",
    handle: "running-shoe",
    description: "Lightweight trail running shoe",
    status: "published",
    collection_id: "col_sport",
    type_id: "ptyp_footwear",
    category_ids: ["cat_shoes"],
    tag_ids: ["tag_new"],
    seller_ids: ["sel_1"],
    variant_skus: ["SHOE-01"],
    attributes: { attr_color: ["red"] },
    prices: [
      { region_id: REGION, currency_code: "usd", min_amount: 80, max_amount: 120 },
    ],
  },
  {
    product_id: "prod_hat",
    title: "Wool Hat",
    handle: "wool-hat",
    description: "Cozy winter hat",
    status: "published",
    collection_id: "col_accessories",
    type_id: "ptyp_accessory",
    category_ids: ["cat_accessories"],
    tag_ids: ["tag_new"],
    seller_ids: ["sel_1"],
    variant_skus: ["HAT-01"],
    attributes: { attr_color: ["red"] },
    prices: [
      { region_id: REGION, currency_code: "usd", min_amount: 20, max_amount: 20 },
    ],
  },
]

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Store - Search", () => {
      let appContainer: MedusaContainer
      let storeHeaders: { headers: Record<string, string> }

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

        const search = appContainer.resolve(MercurModules.SEARCH)
        await search.upsertProducts(seedProducts)
      })

      it("full-text searches and returns region price", async () => {
        const res = await api.get(
          `/store/search?region_id=${REGION}&q=running`,
          storeHeaders
        )

        expect(res.status).toEqual(200)
        expect(res.data.count).toEqual(1)
        expect(res.data.products[0].product_id).toEqual("prod_shoe")
        expect(res.data.products[0].calculated_price).toEqual({
          region_id: REGION,
          currency_code: "usd",
          min_amount: 80,
          max_amount: 120,
        })
        expect(res.data.offset).toEqual(0)
        expect(res.data.limit).toEqual(20)
      })

      it("filters by price range and sorts by price", async () => {
        const res = await api.get(
          `/store/search?region_id=${REGION}&max_price=50&order=price`,
          storeHeaders
        )

        expect(res.status).toEqual(200)
        expect(res.data.products.map((p: { product_id: string }) => p.product_id)).toEqual([
          "prod_hat",
        ])
      })

      it("always returns facet counts", async () => {
        const res = await api.get(
          `/store/search?region_id=${REGION}`,
          storeHeaders
        )

        expect(res.status).toEqual(200)
        const colors = new Map(
          (res.data.facets.attributes.attr_color ?? []).map(
            (b: { value: string; count: number }) => [b.value, b.count]
          )
        )
        expect(colors.get("red")).toEqual(2)
      })

      it("400s when region_id is missing", async () => {
        const err = await api
          .get(`/store/search?q=running`, storeHeaders)
          .catch((e) => e)

        expect(err.response.status).toEqual(400)
      })
    })
  },
})
