import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import MediaModule from "../modules/media"

/**
 * ProductCollection → Image link.
 *
 * Mirrors `media-product-category-link`: the collection owns its images, so
 * `productCollection` is the parent linkable and `isList: true` sits on the
 * image side. A collection resolves its gallery + icon via
 * `collection.media_images`.
 *
 * The reverse alias is `media_images`, NOT the bare `images`: ProductCollection
 * lives in the Medusa product module, whose service config also owns the
 * `Product.images` relation. An `images` link alias there shadows the native
 * relation and breaks every product `query.graph` (see
 * `media-product-category-link`).
 *
 * Reuses the same entity-agnostic `Image` model as categories.
 */
export default defineLink(
  ProductModule.linkable.productCollection,
  {
    linkable: {
      ...MediaModule.linkable.mediaImage,
      alias: "media_images",
    },
    isList: true,
  }
)
