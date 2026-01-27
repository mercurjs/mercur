import { MiddlewareRoute } from "@medusajs/medusa"

import { storeCartsMiddlewares } from "./carts/middlewares"
import { storeOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { storeSellersMiddlewares } from "./sellers/middlewares"

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeCartsMiddlewares,
  ...storeOrderGroupsMiddlewares,
  ...storeSellersMiddlewares,
]
