import {
  ConfigModule,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
  authenticate,
} from "@medusajs/framework"
import { parseCorsOrigins } from "@medusajs/framework/utils"
import cors from "cors"

import { vendorCampaignsMiddlewares } from "./campaigns/middlewares"
import { vendorCollectionsMiddlewares } from "./collections/middlewares"
import { vendorCurrenciesMiddlewares } from "./currencies/middlewares"
import { vendorCustomersMiddlewares } from "./customers/middlewares"
import { vendorFulfillmentProvidersMiddlewares } from "./fulfillment-providers/middlewares"
import { vendorFulfillmentSetsMiddlewares } from "./fulfillment-sets/middlewares"
import { vendorInventoryItemsMiddlewares } from "./inventory-items/middlewares"
import { vendorOrdersMiddlewares } from "./orders/middlewares"
import { vendorPaymentsMiddlewares } from "./payments/middlewares"
import { vendorPayoutsMiddlewares } from "./payouts/middlewares"
import { vendorPayoutAccountsMiddlewares } from "./payout-accounts/middlewares"
import { vendorPriceListsMiddlewares } from "./price-lists/middlewares"
import { vendorPricePreferencesMiddlewares } from "./price-preferences/middlewares"
import { vendorProductCategoriesMiddlewares } from "./product-categories/middlewares"
import { vendorProductsMiddlewares } from "./products/middlewares"
import { vendorProductVariantsMiddlewares } from "./product-variants/middlewares"
import { vendorProductTypesMiddlewares } from "./product-types/middlewares"
import { vendorPromotionsMiddlewares } from "./promotions/middlewares"
import { vendorRegionsMiddlewares } from "./regions/middlewares"
import { vendorRefundReasonsMiddlewares } from "./refund-reasons/middlewares"
import { vendorReturnReasonsMiddlewares } from "./return-reasons/middlewares"
import { vendorReturnsMiddlewares } from "./returns/middlewares"
import { vendorSalesChannelsMiddlewares } from "./sales-channels/middlewares"
import { vendorSellersMiddlewares } from "./sellers/middlewares"
import { vendorShippingOptionsMiddlewares } from "./shipping-options/middlewares"
import { vendorShippingOptionTypesMiddlewares } from "./shipping-option-types/middlewares"
import { vendorShippingProfilesMiddlewares } from "./shipping-profiles/middlewares"
import { vendorStockLocationsMiddlewares } from "./stock-locations/middlewares"
import { vendorStoresMiddlewares } from "./stores/middlewares"
import { vendorUploadsMiddlewares } from "./uploads/middlewares"
import { scanUnauthenticatedRoutes, unlessBaseUrl } from "../utils"
import { vendorProductTagsMiddlewares } from "./product-tags/middlewares"

const unauthenticatedRoutes = [
  /^\/vendor\/sellers$/,
  ...scanUnauthenticatedRoutes(process.cwd()),
]

export const vendorMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/vendor/*",
    middlewares: [
      (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
        const configModule: ConfigModule = req.scope.resolve("configModule")
        return cors({
          // @ts-expect-error: vendorCors is not defined in the medusa http config module
          origin: parseCorsOrigins(configModule.projectConfig.http.vendorCors),
          credentials: true,
        })(req, res, next)
      },
    ],
  },
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
      unlessBaseUrl(
        unauthenticatedRoutes,
        authenticate("seller", ["bearer", "session"], {
          allowUnregistered: false,
        })
      ),
    ],
  },
  ...vendorCampaignsMiddlewares,
  ...vendorCollectionsMiddlewares,
  ...vendorCurrenciesMiddlewares,
  ...vendorCustomersMiddlewares,
  ...vendorFulfillmentProvidersMiddlewares,
  ...vendorFulfillmentSetsMiddlewares,
  ...vendorInventoryItemsMiddlewares,
  ...vendorOrdersMiddlewares,
  ...vendorPaymentsMiddlewares,
  ...vendorPayoutsMiddlewares,
  ...vendorPayoutAccountsMiddlewares,
  ...vendorPriceListsMiddlewares,
  ...vendorPricePreferencesMiddlewares,
  ...vendorProductCategoriesMiddlewares,
  ...vendorProductsMiddlewares,
  ...vendorProductVariantsMiddlewares,
  ...vendorProductTypesMiddlewares,
  ...vendorPromotionsMiddlewares,
  ...vendorRegionsMiddlewares,
  ...vendorRefundReasonsMiddlewares,
  ...vendorReturnReasonsMiddlewares,
  ...vendorReturnsMiddlewares,
  ...vendorSalesChannelsMiddlewares,
  ...vendorSellersMiddlewares,
  ...vendorShippingOptionsMiddlewares,
  ...vendorShippingOptionTypesMiddlewares,
  ...vendorShippingProfilesMiddlewares,
  ...vendorStockLocationsMiddlewares,
  ...vendorStoresMiddlewares,
  ...vendorUploadsMiddlewares,
  ...vendorProductTagsMiddlewares,
]
