import { MiddlewareRoute } from "@medusajs/framework"

import { adminOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { adminPayoutsMiddlewares } from "./payouts/middlewares"

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminOrderGroupsMiddlewares,
  ...adminPayoutsMiddlewares,
]
