import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import MediaModule from "../modules/media"

/**
 * ProductCategory → MediaImage link.
 *
 * Direction is category → media: the category owns its images, so
 * `productCategory` is the parent linkable and `isList: true` sits on the
 * image side. A category resolves its gallery + icon via `category.media_images`.
 *
 * The on-category field is `media_images`, NOT `images`: `productCategory`
 * lives in Medusa's product module, so a link alias of `images` here lands in
 * the same joiner namespace as the product module's own `Product.images`
 * relation and silently shadows it — `query.graph` then resolves
 * `product.images` to this (empty) link instead of the product's real
 * `ProductImage` rows (broke vendor product/variant media). The media entity
 * is likewise named `MediaImage` (not `Image`) to avoid a second global-name
 * clash. The category API layer maps `media_images` back to `images` on the
 * way out (see `remapCategoryMedia`) so the public category contract is
 * unchanged.
 *
 * The same model is reused for product collections later by adding a second,
 * analogous link — keep this entity-agnostic.
 */
export default defineLink(
  ProductModule.linkable.productCategory,
  {
    linkable: MediaModule.linkable.mediaImage,
    isList: true,
  }
)
