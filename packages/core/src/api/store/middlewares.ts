import { MiddlewareRoute } from "@medusajs/medusa"

import { storeOrderGroupsMiddlewares } from "./order-groups/middlewares"

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeOrderGroupsMiddlewares,
]
