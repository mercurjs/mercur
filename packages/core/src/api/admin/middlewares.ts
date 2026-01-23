import { MiddlewareRoute } from "@medusajs/framework"

import { adminOrderGroupsMiddlewares } from "./order-groups/middlewares"

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminOrderGroupsMiddlewares,
]
