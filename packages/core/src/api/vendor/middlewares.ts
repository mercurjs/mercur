import { MiddlewareRoute, authenticate } from "@medusajs/framework"

import { vendorOrdersMiddlewares } from "./orders/middlewares"
import { vendorSellersMiddlewares } from "./sellers/middlewares"

export const vendorMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/vendor/sellers",
    method: ["POST"],
    middlewares: [
      authenticate("seller", ["bearer", "session"], {
        allowUnregistered: true,
      }),
    ],
  },
  {
    matcher: "/vendor/*",
    middlewares: [
      authenticate("seller", ["bearer", "session"], {
        allowUnregistered: false,
      }),
    ],
  },
  ...vendorOrdersMiddlewares,
  ...vendorSellersMiddlewares,
]
