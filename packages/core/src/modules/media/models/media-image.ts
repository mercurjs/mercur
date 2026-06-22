import { model } from "@medusajs/framework/utils"

/**
 * A generic image record owned (via module link) by a marketplace entity
 * such as a product category — and, in a later iteration, a product
 * collection. The owner id is NOT stored here; it lives in the link table.
 *
 * `type` discriminates the icon (`"icon"`) from gallery images (`null`).
 * Among gallery images, `is_thumbnail` / `is_banner` mark the storefront
 * roles; the same image may carry both flags or neither. The single-
 * thumbnail / single-banner / single-icon invariants are enforced in the
 * `setCategoryImages` workflow, not by DB constraints (they span the link
 * table).
 *
 * Table is `media_image`, NOT `image`, AND the model name is `MediaImage`,
 * NOT `Image`: Medusa's product module already owns both a table named
 * `image` and a model named `Image` (its ProductImage). Reusing either name
 * collides in the joiner's entity map, so the `media_images` link alias
 * resolves ambiguously and every product `query.graph` throws
 * `Cannot resolve alias path "" that matches entity Product`.
 */
const MediaImage = model
  .define(
    { tableName: "media_image", name: "MediaImage" },
    {
      id: model.id({ prefix: "medimg" }).primaryKey(),
      url: model.text(),
      type: model.text().nullable(),
      is_thumbnail: model.boolean().default(false),
      is_banner: model.boolean().default(false),
      rank: model.number().default(0),
      metadata: model.json().nullable(),
    }
  )
  .indexes([
    {
      name: "IDX_media_image_type",
      on: ["type"],
      where: "deleted_at IS NULL",
    },
  ])

export default MediaImage
