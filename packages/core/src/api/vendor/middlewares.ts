import { MiddlewareRoute, authenticate } from "@medusajs/framework"

import { vendorCollectionsMiddlewares } from "./collections/middlewares"
import { vendorCustomersMiddlewares } from "./customers/middlewares"
import { vendorOrdersMiddlewares } from "./orders/middlewares"
import { vendorPriceListsMiddlewares } from "./price-lists/middlewares"
import { vendorPricePreferencesMiddlewares } from "./price-preferences/middlewares"
import { vendorProductCategoriesMiddlewares } from "./product-categories/middlewares"
import { vendorProductsMiddlewares } from "./products/middlewares"
import { vendorProductTypesMiddlewares } from "./product-types/middlewares"
import { vendorSalesChannelsMiddlewares } from "./sales-channels/middlewares"
import { vendorSellersMiddlewares } from "./sellers/middlewares"
import { vendorStockLocationsMiddlewares } from "./stock-locations/middlewares"
import { vendorUploadsMiddlewares } from "./uploads/middlewares"

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
  ...vendorCustomersMiddlewares,
  ...vendorOrdersMiddlewares,
  ...vendorPriceListsMiddlewares,
  ...vendorPricePreferencesMiddlewares,
  ...vendorProductCategoriesMiddlewares,
  ...vendorProductsMiddlewares,
  ...vendorProductTypesMiddlewares,
  ...vendorSalesChannelsMiddlewares,
  ...vendorSellersMiddlewares,
  ...vendorStockLocationsMiddlewares,
  ...vendorUploadsMiddlewares,
]
