import { model } from "@medusajs/framework/utils"

const Offer = model
  .define("Offer", {
    id: model.id({ prefix: "offer" }).primaryKey(),
    seller_id: model.text(),
    variant_id: model.text(),
    shipping_profile_id: model.text(),
    sku: model.text().searchable(),
    ean: model.text().searchable().nullable(),
    upc: model.text().searchable().nullable(),
    created_by: model.text(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_offer_seller_sku_unique",
      on: ["seller_id", "sku"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_offer_variant_id",
      on: ["variant_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_offer_seller_id",
      on: ["seller_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_offer_shipping_profile_id",
      on: ["shipping_profile_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_offer_ean",
      on: ["ean"],
      where: "deleted_at IS NULL AND ean IS NOT NULL",
    },
    {
      name: "IDX_offer_upc",
      on: ["upc"],
      where: "deleted_at IS NULL AND upc IS NOT NULL",
    },
  ])

export default Offer
