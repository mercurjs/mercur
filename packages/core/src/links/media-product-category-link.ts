import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import MediaModule from "../modules/media"

/**
 * ProductCategory → Image link.
 *
 * Direction is category → media: the category owns its images, so
 * `productCategory` is the parent linkable and `isList: true` sits on the
 * image side. A category resolves its gallery + icon via `category.images`.
 *
 * The same `Image` model is reused for product collections later by adding
 * a second, analogous link — keep this entity-agnostic.
 */
export default defineLink(
  ProductModule.linkable.productCategory,
  {
    linkable: MediaModule.linkable.mediaImage,
    isList: true,
  }
)
