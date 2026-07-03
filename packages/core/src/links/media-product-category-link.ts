import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import MediaModule from "../modules/media"

/**
 * ProductCategory → Image link.
 *
 * Direction is category → media: the category owns its images, so
 * `productCategory` is the parent linkable and `isList: true` sits on the
 * image side. A category resolves its gallery + icon via
 * `category.media_images`.
 *
 * The reverse alias is `media_images`, NOT the bare `images`: ProductCategory
 * lives in the Medusa product module, whose service config also owns the
 * `Product.images` relation. Registering an `images` link alias on that shared
 * service shadows the native relation and makes the joiner throw
 * `Cannot resolve alias path "" that matches entity Product` on every product
 * query. A distinct alias avoids the collision.
 *
 * The same `Image` model is reused for product collections via a second,
 * analogous link — keep this entity-agnostic.
 */
export default defineLink(
  ProductModule.linkable.productCategory,
  {
    linkable: {
      ...MediaModule.linkable.mediaImage,
      alias: "media_images",
    },
    isList: true,
  }
)
