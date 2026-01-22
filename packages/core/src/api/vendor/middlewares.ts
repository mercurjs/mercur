import { MiddlewareRoute, authenticate } from "@medusajs/framework"

import { vendorCollectionsMiddlewares } from "./collections/middlewares"
import { vendorCustomersMiddlewares } from "./customers/middlewares"
import { vendorFulfillmentSetsMiddlewares } from "./fulfillment-sets/middlewares"
import { vendorOrdersMiddlewares } from "./orders/middlewares"
import { vendorPaymentsMiddlewares } from "./payments/middlewares"
import { vendorPriceListsMiddlewares } from "./price-lists/middlewares"
import { vendorPricePreferencesMiddlewares } from "./price-preferences/middlewares"
import { vendorProductCategoriesMiddlewares } from "./product-categories/middlewares"
import { vendorProductsMiddlewares } from "./products/middlewares"
import { vendorProductTypesMiddlewares } from "./product-types/middlewares"
import { vendorRefundReasonsMiddlewares } from "./refund-reasons/middlewares"
import { vendorReturnReasonsMiddlewares } from "./return-reasons/middlewares"
import { vendorReturnsMiddlewares } from "./returns/middlewares"
import { vendorSalesChannelsMiddlewares } from "./sales-channels/middlewares"
import { vendorSellersMiddlewares } from "./sellers/middlewares"
import { vendorShippingOptionsMiddlewares } from "./shipping-options/middlewares"
import { vendorShippingOptionTypesMiddlewares } from "./shipping-option-types/middlewares"
import { vendorShippingProfilesMiddlewares } from "./shipping-profiles/middlewares"
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
  ...vendorFulfillmentSetsMiddlewares,
  ...vendorOrdersMiddlewares,
  ...vendorPaymentsMiddlewares,
  ...vendorPriceListsMiddlewares,
  ...vendorPricePreferencesMiddlewares,
  ...vendorProductCategoriesMiddlewares,
  ...vendorProductsMiddlewares,
  ...vendorProductTypesMiddlewares,
  ...vendorRefundReasonsMiddlewares,
  ...vendorReturnReasonsMiddlewares,
  ...vendorReturnsMiddlewares,
  ...vendorSalesChannelsMiddlewares,
  ...vendorSellersMiddlewares,
  ...vendorShippingOptionsMiddlewares,
  ...vendorShippingOptionTypesMiddlewares,
  ...vendorShippingProfilesMiddlewares,
  ...vendorStockLocationsMiddlewares,
  ...vendorUploadsMiddlewares,
]
