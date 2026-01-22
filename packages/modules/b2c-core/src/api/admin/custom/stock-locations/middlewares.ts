import { MiddlewareRoute, validateAndTransformQuery } from "@medusajs/framework"

import { adminCustomStockLocationQueryConfig } from "./query-config"
import { AdminGetCustomStockLocationsParams } from "./validators"

export const adminCustomStockLocationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/custom/stock-locations",
    middlewares: [
      validateAndTransformQuery(
        AdminGetCustomStockLocationsParams,
        adminCustomStockLocationQueryConfig.list
      ),
    ],
  },
]


