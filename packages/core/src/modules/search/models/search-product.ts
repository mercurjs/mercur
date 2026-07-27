import { model } from "@medusajs/framework/utils"

import SearchProductPrice from "./search-product-price"

const SearchProduct = model
  .define("search_product", {
    id: model.id({ prefix: "srchprod" }).primaryKey(),
    product_id: model.text(),
    title: model.text().searchable(),
    handle: model.text(),
    description: model.text().searchable().nullable(),
    thumbnail: model.text().nullable(),
    status: model.text(),
    collection_id: model.text().nullable(),
    type_id: model.text().nullable(),
    category_ids: model.json(),
    tag_ids: model.json(),
    seller_ids: model.json(),
    variant_skus: model.json(),
    attributes: model.json(),
    search_text: model.text().nullable(),
    min_amount: model.bigNumber().nullable(),
    max_amount: model.bigNumber().nullable(),
    metadata: model.json().nullable(),
    prices: model.hasMany(() => SearchProductPrice, {
      mappedBy: "product",
    }),
  })
  .cascades({
    delete: ["prices"],
  })
  .indexes([
    {
      name: "IDX_search_product_product_id_unique",
      on: ["product_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_search_product_status",
      on: ["status"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_search_product_collection_id",
      on: ["collection_id"],
      where: "deleted_at IS NULL AND collection_id IS NOT NULL",
    },
    {
      name: "IDX_search_product_type_id",
      on: ["type_id"],
      where: "deleted_at IS NULL AND type_id IS NOT NULL",
    },
  ])

export default SearchProduct
