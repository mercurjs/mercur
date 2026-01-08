import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import WishlistModule from "../modules/wishlist";

export default defineLink(
  { linkable: WishlistModule.linkable.wishlist, isList: true },
  {
    linkable: ProductModule.linkable.product,
    deleteCascade: true,
    isList: true,
  }
);
