import { MiddlewareRoute } from "@medusajs/medusa"

import { storeCartsMiddlewares } from "./carts/middlewares"
import { storeOffersMiddlewares } from "./offers/middlewares"
import { storeOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { storeProductAttributesMiddlewares } from "./product-attributes/middlewares"
import { storeProductCategoriesMiddlewares } from "./product-categories/middlewares"
import { storeProductsMiddlewares } from "./products/middlewares"
import { storeSellersMiddlewares } from "./sellers/middlewares"
import { storeReviewsMiddlewares } from "./reviews/middlewares"

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeCartsMiddlewares,
  ...storeOffersMiddlewares,
  ...storeOrderGroupsMiddlewares,
  ...storeProductAttributesMiddlewares,
  ...storeProductCategoriesMiddlewares,
  ...storeProductsMiddlewares,
  ...storeSellersMiddlewares,
  ...storeReviewsMiddlewares,
]
