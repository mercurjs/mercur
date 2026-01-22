import { MiddlewareRoute, authenticate } from "@medusajs/framework"

import { vendorCollectionsMiddlewares } from "./collections/middlewares"
import { vendorOrdersMiddlewares } from "./orders/middlewares"
import { vendorProductCategoriesMiddlewares } from "./product-categories/middlewares"
import { vendorProductsMiddlewares } from "./products/middlewares"
import { vendorProductTypesMiddlewares } from "./product-types/middlewares"
import { vendorSalesChannelsMiddlewares } from "./sales-channels/middlewares"
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
  ...vendorCollectionsMiddlewares,
  ...vendorOrdersMiddlewares,
  ...vendorProductCategoriesMiddlewares,
  ...vendorProductsMiddlewares,
  ...vendorProductTypesMiddlewares,
  ...vendorSalesChannelsMiddlewares,
  ...vendorSellersMiddlewares,
]
