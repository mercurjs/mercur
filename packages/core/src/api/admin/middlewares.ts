import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { adminOrderGroupQueryConfig } from "./order-groups/query-config"
import { AdminGetOrderGroupParams } from "./order-groups/validators"
import { adminPayoutsMiddlewares } from "./payouts/middlewares"
import { adminSellersMiddlewares } from "./sellers/middlewares"
import { adminAttributeMiddlewares } from "./attributes/middlewares"
import { adminCommissionRatesMiddlewares } from "./commission-rates/middlewares"
import { adminSubscriptionPlanRoutesMiddlewares } from "./subscription-plans/middlewares"
import { requireAdminWarehouseCapability } from "./middlewares/require-warehouse-capability"
import { validateCancelOrderMiddleware } from "./middlewares/validate-cancel-order"
import {
  orderIdFromBody,
  requireSellerValidLocation,
} from "./middlewares/require-seller-valid-location"
import {
  orderIdFromReturnParam,
  requireSellerValidShippingOption,
} from "./middlewares/require-seller-valid-shipping-option"
import {
  orderIdFromOrderEditParam,
  requireSellerValidAddItem,
} from "./middlewares/require-seller-valid-add-item"
import {
  orderIdFromClaimParam,
  orderIdFromExchangeParam,
} from "./middlewares/order-id-resolvers"

const maybeApplySellerProductFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "product_seller",
    resourceId: "product_id",
    filterableField: "seller_id",
  })(req, res, next)
}

const maybeApplySellerOrderFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.query.seller_id) {
    return next()
  }

  req.filterableFields.seller_id = req.query.seller_id

  return maybeApplyLinkFilter({
    entryPoint: "order_seller",
    resourceId: "order_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminAttributeMiddlewares,
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
  ...adminPayoutsMiddlewares,
  ...adminSellersMiddlewares,
  ...adminCommissionRatesMiddlewares,
  ...adminSubscriptionPlanRoutesMiddlewares,
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [
      maybeApplySellerProductFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/orders",
    middlewares: [
      maybeApplySellerOrderFilter,
    ],
  },
  // Mercur cancel-order invariant — enforce marketplace rule regardless of flag.
  // See specs/005-admin-warehouse-capability-lock.
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/cancel",
    middlewares: [validateCancelOrderMiddleware],
  },
  // Seller-valid scoping — spec 006 D-02-006.
  //
  // IMPORTANT: method is intentionally omitted on these Mercur matchers.
  // Medusa's framework registers matchers with explicit `method` using
  // `app[method](...)` which makes them route handlers stacked AFTER
  // core route handlers — they never fire because the core handler
  // responds first. Omitting `method` routes them through `app.use()`
  // which runs as pre-route middleware, reliably before the core
  // handler responds. Each middleware filters by HTTP method internally.
  //
  // Block cross-seller location_id on return creation.
  {
    matcher: "/admin/returns",
    middlewares: [requireSellerValidLocation(orderIdFromBody)],
  },
  // Block cross-seller shipping_option_id on return shipping-method.
  {
    matcher: "/admin/returns/:id/shipping-method",
    middlewares: [
      requireSellerValidShippingOption(orderIdFromReturnParam),
    ],
  },
  // Block cross-seller variant_id on order-edit add-items.
  {
    matcher: "/admin/order-edits/:id/items",
    middlewares: [
      requireSellerValidAddItem(orderIdFromOrderEditParam),
    ],
  },
  // Block cross-seller location + shipping option on claim inbound shipping-method.
  {
    matcher: "/admin/claims/:id/inbound/shipping-method",
    middlewares: [
      requireSellerValidLocation(orderIdFromClaimParam),
      requireSellerValidShippingOption(orderIdFromClaimParam),
    ],
  },
  // Block cross-seller location + shipping option on exchange inbound shipping-method.
  {
    matcher: "/admin/exchanges/:id/inbound/shipping-method",
    middlewares: [
      requireSellerValidLocation(orderIdFromExchangeParam),
      requireSellerValidShippingOption(orderIdFromExchangeParam),
    ],
  },
  // Block cross-seller variant_id on claim outbound items.
  {
    matcher: "/admin/claims/:id/outbound/items",
    middlewares: [
      requireSellerValidAddItem(orderIdFromClaimParam),
    ],
  },
  // Block cross-seller variant_id on exchange outbound items.
  {
    matcher: "/admin/exchanges/:id/outbound/items",
    middlewares: [
      requireSellerValidAddItem(orderIdFromExchangeParam),
    ],
  },
  // Warehouse capability lock — gated by `admin_warehouse_management` feature flag.
  // Baseline Mercur keeps fulfillment vendor-owned; these matchers reject direct
  // admin calls unless the flag is explicitly enabled.
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/cancel",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/mark-as-delivered",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/shipments",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/returns/:id/receive",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/returns/:id/receive/confirm",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/returns/:id/receive-items",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST", "DELETE"],
    matcher: "/admin/returns/:id/receive-items/:action_id",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/returns/:id/dismiss-items",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST", "DELETE"],
    matcher: "/admin/returns/:id/dismiss-items/:action_id",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST"],
    matcher: "/admin/reservations",
    middlewares: [requireAdminWarehouseCapability],
  },
  {
    method: ["POST", "DELETE"],
    matcher: "/admin/reservations/:id",
    middlewares: [requireAdminWarehouseCapability],
  },
]
