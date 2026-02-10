import { MiddlewareRoute } from "@medusajs/framework"

import { adminOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { adminPayoutsMiddlewares } from "./payouts/middlewares"
import { adminSellersMiddlewares } from "./sellers/middlewares"
import { adminCommissionRatesMiddlewares } from "./commission-rates/middlewares"

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminOrderGroupsMiddlewares,
  ...adminPayoutsMiddlewares,
  ...adminSellersMiddlewares,
  ...adminCommissionRatesMiddlewares,
]
