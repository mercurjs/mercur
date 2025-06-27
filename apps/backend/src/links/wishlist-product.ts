import { defineLink } from '@medusajs/framework/utils'
import ProductModule from '@medusajs/medusa/product'

import WishlistModule from '@mercurjs/wishlist'

export default defineLink(WishlistModule.linkable.wishlist, {
  linkable: ProductModule.linkable.product,
  deleteCascade: true,
  isList: true
})
