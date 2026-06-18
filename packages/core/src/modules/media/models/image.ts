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
 * Table is `media_image`, NOT `image`: Medusa's product module already
 * owns a table named `image` (its ProductImage) — reusing it would collide.
 *
 * Entity `name` is `MediaImage`, NOT `Image`: the remote-query link graph
 * keys entities by this name globally. A generic `Image` entity collides
 * with the product module's own image relation and silently shadows
 * `product.images` in `query.graph` (it resolves to the empty media link
 * instead of the product's `ProductImage` rows — MER, variant-media). The
 * service property below stays `Image`, so the `image` linkable key,
 * `field: "image"`, and the `category.images` field alias are unchanged.
 */
const Image = model
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

export default Image
