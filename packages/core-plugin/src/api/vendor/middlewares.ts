import {
  MiddlewareRoute,
  authenticate,
} from "@medusajs/framework"

import { vendorCampaignsMiddlewares } from "./campaigns/middlewares"
import { vendorCollectionsMiddlewares } from "./collections/middlewares"
import { vendorMembersMiddlewares } from "./members/middlewares"
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
import { vendorSubscriptionMiddlewares } from "./subscription/middlewares"
import { vendorUploadsMiddlewares } from "./uploads/middlewares"
import { ensureSellerMiddleware, scanUnauthenticatedRoutes, unlessBaseUrl, vendorCorsMiddleware } from "../utils"
import { vendorProductTagsMiddlewares } from "./product-tags/middlewares"

const unauthenticatedRoutes = [
  /^\/vendor\/sellers$/,
  /^\/vendor\/sellers\/select$/,
  /^\/vendor\/feature-flags$/,
  /^\/vendor\/stores$/,
  /^\/vendor\/members\/invites\/accept$/,
  ...scanUnauthenticatedRoutes(process.cwd()),
]

export const vendorMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/vendor/sellers",
    method: ["POST", "GET"],
    middlewares: [
      authenticate("member", ["session", "bearer"], {
        allowUnregistered: true,
      }),
    ],
  },
  {
    matcher: "/vendor/sellers/select",
    method: ["POST"],
    middlewares: [
      authenticate("member", ["session", "bearer"], {
        allowUnregistered: false,
      }),
    ],
  },
  {
    matcher: "/vendor/*",
    method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    middlewares: [
      vendorCorsMiddleware,
      unlessBaseUrl(
        unauthenticatedRoutes,
        authenticate("member", ["session", "bearer"], {
          allowUnregistered: false,
        })
      ),
      unlessBaseUrl(
        unauthenticatedRoutes,
        ensureSellerMiddleware
      ),
    ],
  },
  ...vendorMembersMiddlewares,
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
  ...vendorSubscriptionMiddlewares,
]
