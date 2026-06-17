import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import MediaModule from "../modules/media"

/**
 * ProductCollection → Image link.
 *
 * Mirrors `media-product-category-link`: the collection owns its images, so
 * `productCollection` is the parent linkable and `isList: true` sits on the
 * image side. A collection resolves its gallery + icon via `collection.images`.
 *
 * Reuses the same entity-agnostic `Image` model as categories.
 */
export default defineLink(
  ProductModule.linkable.productCollection,
  {
    linkable: MediaModule.linkable.image,
    isList: true,
  }
)
