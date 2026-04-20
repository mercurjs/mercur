import { MiddlewareRoute } from "@medusajs/medusa"

import { storeCartsMiddlewares } from "./carts/middlewares"
import { storeOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { storeProductAttributesMiddlewares } from "./product-attributes/middlewares"
import { storeProductBrandsMiddlewares } from "./product-brands/middlewares"
import { storeProductCategoriesMiddlewares } from "./product-categories/middlewares"
import { storeProductsMiddlewares } from "./products/middlewares"
import { storeSellersMiddlewares } from "./sellers/middlewares"

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeCartsMiddlewares,
  ...storeOrderGroupsMiddlewares,
  ...storeProductAttributesMiddlewares,
  ...storeProductBrandsMiddlewares,
  ...storeProductCategoriesMiddlewares,
  ...storeProductsMiddlewares,
  ...storeSellersMiddlewares,
]
