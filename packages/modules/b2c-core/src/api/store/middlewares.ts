import { MiddlewareRoute, authenticate } from "@medusajs/framework";

import { storeCartsMiddlewares } from "./carts/middlewares";
import { storeCustomerAvatarMiddlewares } from "./custom/customers/me/avatar/middlewares";
import { storeCustomerMeMiddlewares } from "./custom/customers/me/middlewares";
import { storeOrderSetMiddlewares } from "./order-set/middlewares";
import { storeProductsMiddlewares } from "./products/middlewares";
import { storeReturnsMiddlewares } from "./returns/middlewares";
import { storeSellerMiddlewares } from "./seller/middlewares";
import { storeShippingOptionRoutesMiddlewares } from "./shipping-options/middlewares";
import { storeWishlistMiddlewares } from "./wishlist/middlewares";

export const storeMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/reviews/*",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/return-request/*",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  ...storeCartsMiddlewares,
  ...storeCustomerAvatarMiddlewares,
  ...storeCustomerMeMiddlewares,
  ...storeOrderSetMiddlewares,
  ...storeProductsMiddlewares,
  ...storeSellerMiddlewares,
  ...storeShippingOptionRoutesMiddlewares,
  ...storeReturnsMiddlewares,
  ...storeWishlistMiddlewares,
];
