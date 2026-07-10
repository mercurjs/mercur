import { model } from "@medusajs/framework/utils"

import SearchProduct from "./search-product"

const SearchProductPrice = model
  .define("search_product_price", {
    id: model.id({ prefix: "srchprice" }).primaryKey(),
    region_id: model.text(),
    currency_code: model.text(),
    min_amount: model.bigNumber(),
    max_amount: model.bigNumber(),
    product: model.belongsTo(() => SearchProduct, {
      mappedBy: "prices",
    }),
  })
  .indexes([
    {
      name: "IDX_search_product_price_product_region_unique",
      on: ["product_id", "region_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_search_product_price_region_min_amount",
      on: ["region_id", "min_amount"],
      where: "deleted_at IS NULL",
    },
  ])

export default SearchProductPrice
