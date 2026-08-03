import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { adminOrderGroupQueryConfig } from "./order-groups/query-config"
import { AdminGetOrderGroupParams } from "./order-groups/validators"
import { adminOrdersMiddlewares } from "./orders/middlewares"
import { adminCustomerGroupsMiddlewares } from "./customer-groups/middlewares"
import { adminOffersMiddlewares } from "./offers/middlewares"
import { adminPayoutsMiddlewares } from "./payouts/middlewares"
import { adminSellersMiddlewares } from "./sellers/middlewares"
import { adminMembersMiddlewares } from "./members/middlewares"
import { adminCommissionRatesMiddlewares } from "./commission-rates/middlewares"

import { adminProductsMiddlewares } from "./products/middlewares"
import { adminPromotionsMiddlewares } from "./promotions/middlewares"
import { adminCampaignsMiddlewares } from "./campaigns/middlewares"
import { adminPriceListsMiddlewares } from "./price-lists/middlewares"
import { adminCollectionsMiddlewares } from "./collections/middlewares"
import { adminProductCategoriesMiddlewares } from "./product-categories/middlewares"
import { adminProductAttributesMiddlewares } from "./product-attributes/middlewares"
import { adminProductChangesMiddlewares } from "./product-changes/middlewares"
import { adminStockLocationsMiddlewares } from "./stock-locations/middlewares"
import { adminReservationsMiddlewares } from "./reservations/middlewares"
import { adminInventoryItemsMiddlewares } from "./inventory-items/middlewares"
import { adminShippingOptionsMiddlewares } from "./shipping-options/middlewares"
import { adminShippingProfilesMiddlewares } from "./shipping-profiles/middlewares"
import { adminReviewsMiddlewares } from "./reviews/middlewares"

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminOrderGroupsMiddlewares,
  {
    method: ["GET"],
    matcher: "/admin/orders/:id/order-group",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOrderGroupParams,
        adminOrderGroupQueryConfig.retrieve
      ),
    ],
  },
  ...adminOrdersMiddlewares,
  ...adminCustomerGroupsMiddlewares,
  ...adminOffersMiddlewares,
  ...adminPayoutsMiddlewares,
  ...adminSellersMiddlewares,
  ...adminMembersMiddlewares,
  ...adminCommissionRatesMiddlewares,
  ...adminProductsMiddlewares,
  ...adminPromotionsMiddlewares,
  ...adminCampaignsMiddlewares,
  ...adminPriceListsMiddlewares,
  ...adminCollectionsMiddlewares,
  ...adminProductCategoriesMiddlewares,
  ...adminProductAttributesMiddlewares,
  ...adminProductChangesMiddlewares,
  ...adminStockLocationsMiddlewares,
  ...adminReservationsMiddlewares,
  ...adminInventoryItemsMiddlewares,
  ...adminShippingOptionsMiddlewares,
  ...adminShippingProfilesMiddlewares,
  ...adminReviewsMiddlewares,
]
