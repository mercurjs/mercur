import { model } from "@medusajs/framework/utils";
import Product from "./product";
import ProductAttributeValue from "./product-attribute-value";
import ProductImage from "./product-image";
import ProductVariantProductImage from "./product-variant-product-image";

const ProductVariant = model
  .define("ProductVariant", {
    // --- Medusa original fields ---
    id: model.id({ prefix: "variant" }).primaryKey(),
    title: model.text().searchable().translatable(),
    sku: model.text().searchable().nullable(),
    barcode: model.text().searchable().nullable(),
    ean: model.text().searchable().nullable(),
    upc: model.text().searchable().nullable(),
    allow_backorder: model.boolean().default(false),
    manage_inventory: model.boolean().default(true),
    hs_code: model.text().nullable(),
    origin_country: model.text().nullable(),
    mid_code: model.text().nullable(),
    material: model.text().translatable().nullable(),
    weight: model.number().nullable(),
    length: model.number().nullable(),
    height: model.number().nullable(),
    width: model.number().nullable(),
    metadata: model.json().nullable(),
    variant_rank: model.number().default(0).nullable(),
    thumbnail: model.text().nullable(),

    // --- Marketplace additions ---
    isbn: model.text().searchable().nullable(),
    asin: model.text().searchable().nullable(),
    gtin: model.text().searchable().nullable(),

    // --- Medusa original relations ---
    product: model
      .belongsTo(() => Product, {
        mappedBy: "variants",
      })
      .searchable()
      .nullable(),
    images: model.manyToMany(() => ProductImage, {
      mappedBy: "variants",
      pivotEntity: () => ProductVariantProductImage,
    }),
    attribute_values: model.manyToMany(() => ProductAttributeValue, {
      pivotTable: "product_variant_attribute_value",
      mappedBy: "variants",
    }),
  })
  .indexes([
    {
      name: "IDX_product_variant_id_product_id",
      on: ["id", "product_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_variant_product_id",
      on: ["product_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_variant_sku_unique",
      on: ["sku"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_variant_barcode_unique",
      on: ["barcode"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_variant_ean_unique",
      on: ["ean"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_variant_upc_unique",
      on: ["upc"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_variant_isbn_unique",
      on: ["isbn"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_variant_asin_unique",
      on: ["asin"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_variant_gtin_unique",
      on: ["gtin"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

export default ProductVariant;
