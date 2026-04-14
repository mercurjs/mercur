import { model } from "@medusajs/framework/utils";
import { ProductStatus } from "@mercurjs/types";
import ProductAttribute from "./product-attribute";
import ProductBrand from "./product-brand";
import ProductCategory from "./product-category";
import ProductChange from "./product-change";
import ProductCollection from "./product-collection";
import ProductImage from "./product-image";
import ProductTag from "./product-tag";
import ProductType from "./product-type";
import ProductVariant from "./product-variant";

const Product = model
  .define("Product", {
    // --- Medusa original fields (unchanged) ---
    id: model.id({ prefix: "prod" }).primaryKey(),
    title: model.text().searchable().translatable(),
    handle: model.text(),
    subtitle: model.text().searchable().translatable().nullable(),
    description: model.text().searchable().translatable().nullable(),
    is_giftcard: model.boolean().default(false),
    thumbnail: model.text().nullable(),
    weight: model.text().nullable(),
    length: model.text().nullable(),
    height: model.text().nullable(),
    width: model.text().nullable(),
    origin_country: model.text().nullable(),
    hs_code: model.text().nullable(),
    mid_code: model.text().nullable(),
    material: model.text().translatable().nullable(),
    discountable: model.boolean().default(true),
    external_id: model.text().nullable(),
    metadata: model.json().nullable(),

    // --- Marketplace additions ---
    status: model.enum(ProductStatus).default(ProductStatus.PENDING),
    is_active: model.boolean().default(false),
    is_restricted: model.boolean().default(false),
    created_by: model.text().nullable(),
    created_by_actor: model.text().searchable().nullable(),

    // --- Medusa original relations (unchanged) ---
    variants: model.hasMany(() => ProductVariant, {
      mappedBy: "product",
    }),
    type: model
      .belongsTo(() => ProductType, {
        mappedBy: "products",
      })
      .nullable(),
    brand: model
      .belongsTo(() => ProductBrand, {
        mappedBy: "products",
      })
      .nullable(),
    tags: model.manyToMany(() => ProductTag, {
      mappedBy: "products",
      pivotTable: "product_tags",
    }),
    images: model.hasMany(() => ProductImage, {
      mappedBy: "product",
    }),
    collection: model
      .belongsTo(() => ProductCollection, {
        mappedBy: "products",
      })
      .nullable(),
    categories: model.manyToMany(() => ProductCategory, {
      pivotTable: "product_category_product",
      mappedBy: "products",
    }),
    variant_attributes: model.manyToMany(() => ProductAttribute, {
      mappedBy: "variant_products",
    }),
    changes: model.hasMany(() => ProductChange, {
      mappedBy: "product",
    }),
  })
  .cascades({
    delete: ["variants", "images"],
  })
  .indexes([
    {
      name: "IDX_product_handle_unique",
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_type_id",
      on: ["type_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_collection_id",
      on: ["collection_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_status",
      on: ["status"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_is_active",
      on: ["is_active"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_brand_id",
      on: ["brand_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_created_by",
      on: ["created_by"],
      unique: false,
      where: "deleted_at IS NULL AND created_by IS NOT NULL",
    },
    {
      name: "IDX_product_created_by_actor",
      on: ["created_by_actor"],
      unique: false,
      where: "deleted_at IS NULL AND created_by_actor IS NOT NULL",
    },
  ]);

export default Product;
