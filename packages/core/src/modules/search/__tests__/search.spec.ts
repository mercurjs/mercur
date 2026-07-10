import path from "path"

import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { MercurModules } from "@mercurjs/types"

import { SearchProduct, SearchProductPrice } from "../models"
import SearchModuleService from "../service"
import { SearchProductInput } from "../types"

const REGION_EU = "reg_eu"
const REGION_US = "reg_us"

const products: SearchProductInput[] = [
  {
    product_id: "prod_shoe",
    title: "Running Shoe",
    handle: "running-shoe",
    description: "Lightweight trail running shoe",
    status: "published",
    collection_id: "col_sport",
    type_id: "ptyp_footwear",
    category_ids: ["cat_shoes", "cat_sport"],
    tag_ids: ["tag_new"],
    seller_ids: ["sel_1"],
    variant_skus: ["SHOE-01"],
    attributes: { attr_color: ["red"], attr_size: ["42"] },
    prices: [
      { region_id: REGION_EU, currency_code: "eur", min_amount: 80, max_amount: 120 },
      { region_id: REGION_US, currency_code: "usd", min_amount: 90, max_amount: 130 },
    ],
  },
  {
    product_id: "prod_boot",
    title: "Winter Boot",
    handle: "winter-boot",
    description: "Warm waterproof boot",
    status: "published",
    collection_id: "col_sport",
    type_id: "ptyp_footwear",
    category_ids: ["cat_shoes"],
    tag_ids: ["tag_sale"],
    seller_ids: ["sel_2"],
    variant_skus: ["BOOT-01"],
    attributes: { attr_color: ["black"], attr_size: ["44"] },
    prices: [
      { region_id: REGION_EU, currency_code: "eur", min_amount: 200, max_amount: 200 },
      { region_id: REGION_US, currency_code: "usd", min_amount: 220, max_amount: 220 },
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
      { region_id: REGION_EU, currency_code: "eur", min_amount: 20, max_amount: 20 },
      { region_id: REGION_US, currency_code: "usd", min_amount: 25, max_amount: 25 },
    ],
  },
]

moduleIntegrationTestRunner<SearchModuleService>({
  moduleName: MercurModules.SEARCH,
  moduleModels: [SearchProduct, SearchProductPrice],
  resolve: path.join(__dirname, ".."),
  testSuite: ({ service }) => {
    describe("SearchModuleService", () => {
      beforeEach(async () => {
        await service.upsertProducts(products)
      })

      it("full-text searches over title/description", async () => {
        const { products: hits } = await service.search({
          q: "running",
          region_id: REGION_EU,
        })
        expect(hits.map((p) => p.product_id)).toEqual(["prod_shoe"])
      })

      it("returns the region-scoped calculated price", async () => {
        const { products: hits } = await service.search({
          q: "wool hat",
          region_id: REGION_US,
        })
        expect(hits[0].calculated_price).toEqual({
          region_id: REGION_US,
          currency_code: "usd",
          min_amount: 25,
          max_amount: 25,
        })
      })

      it("filters by region price range", async () => {
        const { products: hits } = await service.search({
          region_id: REGION_EU,
          filters: { price: { lte: 50 } },
        })
        expect(hits.map((p) => p.product_id)).toEqual(["prod_hat"])
      })

      it("filters by category and attribute", async () => {
        const { products: hits } = await service.search({
          region_id: REGION_EU,
          filters: {
            category_ids: ["cat_shoes"],
            attributes: { attr_color: ["red"] },
          },
        })
        expect(hits.map((p) => p.product_id)).toEqual(["prod_shoe"])
      })

      it("computes facet counts", async () => {
        const facets = await service.getFacets({
          region_id: REGION_EU,
          price_ranges: [
            { lte: 50 },
            { gte: 50, lte: 150 },
            { gte: 150 },
          ],
        })

        const category = new Map(
          facets.categories.map((b) => [b.value, b.count])
        )
        expect(category.get("cat_shoes")).toBe(2)
        expect(category.get("cat_accessories")).toBe(1)

        const color = new Map(
          (facets.attributes.attr_color ?? []).map((b) => [b.value, b.count])
        )
        expect(color.get("red")).toBe(2)
        expect(color.get("black")).toBe(1)

        expect(facets.price_ranges.map((b) => b.count)).toEqual([1, 1, 1])
      })

      it("excludes a facet's own selection from its counts (drill-down)", async () => {
        const facets = await service.getFacets({
          region_id: REGION_EU,
          filters: { tag_ids: ["tag_sale"] },
        })
        const tags = new Map(facets.tags.map((b) => [b.value, b.count]))
        expect(tags.get("tag_new")).toBe(2)
        expect(tags.get("tag_sale")).toBe(1)
        const category = new Map(
          facets.categories.map((b) => [b.value, b.count])
        )
        expect(category.get("cat_shoes")).toBe(1)
        expect(category.get("cat_accessories")).toBeUndefined()
      })

      it("removes a product on delete", async () => {
        await service.deleteProducts(["prod_shoe"])
        const { count } = await service.search({
          q: "running",
          region_id: REGION_EU,
        })
        expect(count).toBe(0)
      })
    })
  },
})
